import express from 'express';
import { stripe, isStripeConfigured } from '../config/stripe.js';
import { pool } from '../config/db.js';
import { generateInvoicePDF } from '../services/invoice.service.js';
import { sendSubscriptionConfirmation } from '../services/email.service.js';
import { invalidateAnalyticsCache } from '../services/analytics.service.js';

const router = express.Router();

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        if (isStripeConfigured() && webhookSecret && !webhookSecret.includes('your_webhook')) {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            // Raw JSON body fallback if signature check not configured
            event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        }
    } catch (err) {
        console.error('⚠️ Stripe Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`⚡ Received Stripe Webhook Event: ${event.type}`);

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const customerEmail = session.customer_details?.email || session.customer_email || 'subscriber@example.com';
                const customerName = session.customer_details?.name || 'SaaS Customer';
                const planId = session.metadata?.planId || 'pro';
                const planName = session.metadata?.planName || 'Pro Plan';
                const amount = parseFloat(session.metadata?.amount || '49.00');

                // Upsert User
                let userRes = await pool.query('SELECT * FROM users WHERE email = $1', [customerEmail]);
                let user = userRes.rows[0];
                if (!user) {
                    const newUser = await pool.query(
                        'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
                        [customerEmail, customerName]
                    );
                    user = newUser.rows[0];
                }

                // Create Subscription
                const periodStart = new Date();
                const periodEnd = new Date();
                periodEnd.setMonth(periodEnd.getMonth() + 1);

                const stripeSubId = session.subscription || `sub_stripe_${Date.now()}`;
                const stripeCustId = session.customer || `cus_stripe_${Date.now()}`;

                const subRes = await pool.query(
                    `INSERT INTO subscriptions 
                    (user_id, stripe_customer_id, stripe_subscription_id, plan_id, plan_name, amount, currency, status, current_period_start, current_period_end)
                    VALUES ($1, $2, $3, $4, $5, $6, 'usd', 'active', $7, $8)
                    ON CONFLICT (stripe_subscription_id) DO UPDATE SET status = 'active', updated_at = NOW()
                    RETURNING *`,
                    [user.id, stripeCustId, stripeSubId, planId, planName, amount, periodStart, periodEnd]
                );
                const subscription = subRes.rows[0];

                // Create Invoice
                const invoiceDbRes = await pool.query(
                    `INSERT INTO invoices (subscription_id, user_id, stripe_invoice_id, amount_paid, status)
                    VALUES ($1, $2, $3, $4, 'paid') RETURNING *`,
                    [subscription.id, user.id, session.invoice || `inv_${Date.now()}`, amount]
                );
                const invoiceRecord = invoiceDbRes.rows[0];

                // Generate PDF Invoice
                const pdfResult = await generateInvoicePDF({
                    invoiceId: invoiceRecord.id,
                    userEmail: user.email,
                    userName: user.name,
                    planName,
                    amount
                });

                await pool.query('UPDATE invoices SET pdf_path = $1 WHERE id = $2', [pdfResult.filePath, invoiceRecord.id]);

                // Send Email
                await sendSubscriptionConfirmation({
                    userEmail: user.email,
                    userName: user.name,
                    planName,
                    amount,
                    invoicePath: pdfResult.filePath
                });

                // Invalidate Cache
                await invalidateAnalyticsCache();
                break;
            }

            case 'customer.subscription.deleted': {
                const subObj = event.data.object;
                await pool.query(
                    "UPDATE subscriptions SET status = 'canceled', updated_at = NOW() WHERE stripe_subscription_id = $1",
                    [subObj.id]
                );
                await invalidateAnalyticsCache();
                break;
            }

            default:
                console.log(`Unhandled webhook event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (err) {
        console.error('❌ Webhook processing error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;
