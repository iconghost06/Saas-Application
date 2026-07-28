import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import { getPlatformAnalytics } from './services/analytics.service.js';
import { pool } from './config/db.js';
import { enqueueRenewalReminder } from './services/queue.service.js';

dotenv.config();

const app = express();

app.use(cors());

// Webhooks router uses raw body, so mount webhook routes BEFORE express.json()
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());

// Main API Routes
app.use('/api/auth', authRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// --- HTTP Bridge for MCP Tools (allows Frontend AI Console to invoke MCP tools over HTTP) ---
app.post('/api/mcp/execute', async (req, res) => {
    try {
        const { toolName, args = {} } = req.body;

        switch (toolName) {
            case 'get_platform_statistics': {
                const stats = await getPlatformAnalytics(Boolean(args.forceRefresh));
                return res.json({ result: stats });
            }
            case 'get_subscriber_details': {
                const { email } = args;
                const result = await pool.query(
                    `SELECT s.*, u.name, u.email 
                     FROM subscriptions s 
                     JOIN users u ON s.user_id = u.id 
                     WHERE u.email = $1 
                     ORDER BY s.created_at DESC LIMIT 1`,
                    [email]
                );
                return res.json({ result: result.rows[0] || { message: 'No subscriber found' } });
            }
            case 'get_expiring_subscriptions': {
                const days = args.daysThreshold || 7;
                const result = await pool.query(
                    `SELECT s.id, s.plan_name, s.current_period_end, u.email, u.name 
                     FROM subscriptions s 
                     JOIN users u ON s.user_id = u.id 
                     WHERE s.status = 'active' 
                       AND s.current_period_end <= NOW() + (INTERVAL '1 day' * $1)
                     ORDER BY s.current_period_end ASC`,
                    [days]
                );
                return res.json({ result: { expiringCount: result.rows.length, subscriptions: result.rows } });
            }
            case 'trigger_renewal_reminder': {
                const { userEmail, userName = 'Subscriber', planName, periodEnd = new Date().toISOString() } = args;
                const job = await enqueueRenewalReminder({ userEmail, userName, planName, periodEnd });
                return res.json({ result: { success: true, jobId: job.id, message: `Renewal reminder enqueued for ${userEmail}` } });
            }
            default:
                return res.status(400).json({ error: `Unknown tool: ${toolName}` });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
