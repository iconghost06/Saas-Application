import express from 'express';
import { stripe, isStripeConfigured } from '../config/stripe.js';
import { pool } from '../config/db.js';
import { generateInvoicePDF } from '../services/invoice.service.js';
import { sendSubscriptionConfirmation } from '../services/email.service.js';
import { invalidateAnalyticsCache } from '../services/analytics.service.js';

const router = express.Router();

export const PRICING_TIERS = {
    basic: { 
        id: 'basic',
        name: 'Basic Plan', 
        amount: 19.00,
        currency: 'usd',
        period: '/month',
        stripePriceId: 'price_1Txru5FC168iFw0OE6OWV932',
        description: 'Essential analytics and subscription tracking for growing startups.',
        features: [
            'Up to 100 subscribers tracked',
            'Standard revenue analytics',
            'Automated PDF Invoices',
            'Basic Email Notifications'
        ],
        featured: false
    },
    pro: { 
        id: 'pro',
        name: 'Pro Plan', 
        amount: 49.00,
        currency: 'usd',
        period: '/month',
        stripePriceId: 'price_1TxruPFC168iFw0O54qbIMGo',
        description: 'Advanced analytics, AI forecasts, and priority BullMQ queues.',
        features: [
            'Unlimited subscribers tracked',
            'Redis-backed Instant Analytics',
            'AI Agent MCP Integration',
            'Automated 3-Day Renewal Warnings',
            'Priority Support'
        ],
        featured: true
    },
    enterprise: { 
        id: 'enterprise',
        name: 'Elite Plan', 
        amount: 199.00,
        currency: 'usd',
        period: '/month',
        stripePriceId: 'price_1TxruhFC168iFw0OWxmbzeXJ',
        description: 'Dedicated infrastructure, custom MCP tools, and high-frequency sync.',
        features: [
            'Dedicated PostgreSQL & Redis',
            'Custom MCP AI Agent Workflows',
            'SLA 99.9% Uptime Guarantee',
            'Custom Billing & Multi-Currency',
            'Dedicated Account Manager'
        ],
        featured: false
    }
};

// GET /api/checkout/plans - Returns pricing plans from backend configuration
router.get('/plans', (req, res) => {
    res.json(Object.values(PRICING_TIERS));
});

// POST /api/checkout/create-session - Redirects directly to Stripe Checkout Portal using Price IDs
router.post('/create-session', async (req, res) => {
    try {
        const { planId = 'pro', userEmail = 'client@example.com', userName = 'Jane Client', userId } = req.body;
        const selectedPlan = PRICING_TIERS[planId.toLowerCase()] || PRICING_TIERS.pro;
        const appUrl = process.env.APP_URL || 'http://localhost:5173';

        console.log(`💳 Creating Stripe Checkout Session for ${userEmail} (${selectedPlan.name} - Price ID: ${selectedPlan.stripePriceId})...`);

        if (isStripeConfigured()) {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'subscription',
                customer_email: userEmail,
                line_items: [
                    {
                        price: selectedPlan.stripePriceId,
                        quantity: 1,
                    },
                ],
                success_url: `${appUrl}/?session_id={CHECKOUT_SESSION_ID}&success=true`,
                cancel_url: `${appUrl}/?canceled=true`,
                metadata: {
                    planId,
                    planName: selectedPlan.name,
                    amount: selectedPlan.amount.toString(),
                    userName,
                    userId: userId ? userId.toString() : ''
                }
            });

            return res.json({ url: session.url, sessionId: session.id, isSimulated: false });
        } else {
            // Simulated Test Mode Fallback
            let userRes = await pool.query('SELECT * FROM users WHERE email = $1', [userEmail]);
            let user = userRes.rows[0];
            if (!user) {
                const newUser = await pool.query(
                    "INSERT INTO users (email, password_hash, name, role) VALUES ($1, 'client123', $2, 'client') RETURNING *",
                    [userEmail, userName]
                );
                user = newUser.rows[0];
            }

            const periodStart = new Date();
            const periodEnd = new Date();
            periodEnd.setMonth(periodEnd.getMonth() + 1);

            const mockSubId = `sub_test_${Date.now()}`;
            const mockCustId = `cus_test_${Date.now()}`;

            const subRes = await pool.query(
                `INSERT INTO subscriptions 
                (user_id, stripe_customer_id, stripe_subscription_id, plan_id, plan_name, amount, currency, status, current_period_start, current_period_end)
                VALUES ($1, $2, $3, $4, $5, $6, 'usd', 'active', $7, $8)
                ON CONFLICT (stripe_subscription_id) DO UPDATE SET status = 'active', updated_at = NOW()
                RETURNING *`,
                [user.id, mockCustId, mockSubId, planId, selectedPlan.name, selectedPlan.amount, periodStart, periodEnd]
            );
            const subscription = subRes.rows[0];

            const mockInvoiceId = `inv_test_${Date.now()}`;
            const invoiceDbRes = await pool.query(
                `INSERT INTO invoices (subscription_id, user_id, stripe_invoice_id, amount_paid, status)
                VALUES ($1, $2, $3, $4, 'paid') RETURNING *`,
                [subscription.id, user.id, mockInvoiceId, selectedPlan.amount]
            );
            const invoiceRecord = invoiceDbRes.rows[0];

            const pdfResult = await generateInvoicePDF({
                invoiceId: invoiceRecord.id,
                userEmail: user.email,
                userName: user.name,
                planName: selectedPlan.name,
                amount: selectedPlan.amount
            });

            await pool.query('UPDATE invoices SET pdf_path = $1 WHERE id = $2', [pdfResult.filePath, invoiceRecord.id]);

            await sendSubscriptionConfirmation({
                userEmail: user.email,
                userName: user.name,
                planName: selectedPlan.name,
                amount: selectedPlan.amount,
                invoicePath: pdfResult.filePath
            });

            await invalidateAnalyticsCache();

            return res.json({
                success: true,
                message: 'Subscription created successfully',
                isSimulated: true,
                user,
                subscription,
                invoice: { id: invoiceRecord.id, pdfPath: pdfResult.fileName }
            });
        }
    } catch (err) {
        console.error('❌ Checkout session creation failed:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/checkout/verify-session - Handles checkout return from Stripe
router.get('/verify-session', async (req, res) => {
    try {
        const { session_id } = req.query;
        if (!session_id || !isStripeConfigured()) {
            return res.status(400).json({ error: 'Session ID required' });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id);
        if (session.payment_status !== 'paid') {
            return res.status(400).json({ error: 'Payment not completed' });
        }

        const customerEmail = session.customer_details?.email || session.customer_email || 'client@example.com';
        const customerName = session.customer_details?.name || 'SaaS Client';
        const planId = session.metadata?.planId || 'pro';
        const planName = session.metadata?.planName || 'Pro Plan';
        const amount = parseFloat(session.metadata?.amount || '49.00');

        let userRes = await pool.query('SELECT * FROM users WHERE email = $1', [customerEmail]);
        let user = userRes.rows[0];
        if (!user) {
            const newUser = await pool.query(
                "INSERT INTO users (email, password_hash, name, role) VALUES ($1, 'client123', $2, 'client') RETURNING *",
                [customerEmail, customerName]
            );
            user = newUser.rows[0];
        }

        const periodStart = new Date();
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const stripeSubId = session.subscription || `sub_stripe_${Date.now()}`;
        const stripeCustId = session.customer || `cus_stripe_${Date.now()}`;

        const subRes = await pool.query(
            `INSERT INTO subscriptions 
            (user_id, stripe_customer_id, stripe_subscription_id, plan_id, plan_name, amount, currency, status, current_period_start, current_period_end)
            VALUES ($1, $2, $3, $4, $5, $6, 'usd', 'active', $7, $8)
            ON CONFLICT (stripe_subscription_id) DO UPDATE SET status = 'active', plan_name = $5, amount = $6, updated_at = NOW()
            RETURNING *`,
            [user.id, stripeCustId, stripeSubId, planId, planName, amount, periodStart, periodEnd]
        );
        const subscription = subRes.rows[0];

        const invoiceDbRes = await pool.query(
            `INSERT INTO invoices (subscription_id, user_id, stripe_invoice_id, amount_paid, status)
            VALUES ($1, $2, $3, $4, 'paid') RETURNING *`,
            [subscription.id, user.id, session.invoice || `inv_${Date.now()}`, amount]
        );
        const invoiceRecord = invoiceDbRes.rows[0];

        const pdfResult = await generateInvoicePDF({
            invoiceId: invoiceRecord.id,
            userEmail: user.email,
            userName: user.name,
            planName,
            amount
        });

        await pool.query('UPDATE invoices SET pdf_path = $1 WHERE id = $2', [pdfResult.filePath, invoiceRecord.id]);

        await sendSubscriptionConfirmation({
            userEmail: user.email,
            userName: user.name,
            planName,
            amount,
            invoicePath: pdfResult.filePath
        });

        await invalidateAnalyticsCache();

        res.json({ success: true, subscription, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
