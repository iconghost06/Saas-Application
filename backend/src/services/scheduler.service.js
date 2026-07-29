import cron from 'node-cron';
import { pool } from '../config/db.js';
import { enqueueRenewalReminder } from './queue.service.js';

export function startSubscriptionScheduler() {
    console.log('Starting Subscription Expiration Lifecycle Scheduler (Cron)...');

    cron.schedule('0 */6 * * *', async () => {
        console.log('[Cron Job] Running check for expiring subscriptions...');
        await checkAndProcessExpiringSubscriptions();
    });
}

export async function checkAndProcessExpiringSubscriptions() {
    try {
        const query = `
            SELECT 
                s.id as subscription_id, 
                s.plan_name, 
                s.current_period_end, 
                u.email as user_email, 
                u.name as user_name
            FROM subscriptions s
            JOIN users u ON s.user_id = u.id
            WHERE s.status = 'active'
              AND s.current_period_end > NOW()
              AND s.current_period_end <= NOW() + INTERVAL '3 days'
        `;
        const result = await pool.query(query);
        console.log(`Found ${result.rows.length} expiring subscriptions near period end.`);

        for (const row of result.rows) {
            await enqueueRenewalReminder({
                subscriptionId: row.subscription_id,
                userEmail: row.user_email,
                userName: row.user_name,
                planName: row.plan_name,
                periodEnd: row.current_period_end
            });
        }
        return result.rows.length;
    } catch (err) {
        console.error('Error during expiring subscription check:', err.message);
        throw err;
    }
}
