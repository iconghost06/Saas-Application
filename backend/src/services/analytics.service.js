import { pool } from '../config/db.js';
import { redisClient } from '../config/redis.js';

const CACHE_KEY = 'platform_analytics_summary';
const CACHE_TTL_SECONDS = 300; // 5 minutes cache

export async function getPlatformAnalytics(forceRefresh = false) {
    try {
        if (!forceRefresh) {
            const cachedData = await redisClient.get(CACHE_KEY);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                return { ...parsed, isCached: true };
            }
        }

        // Query DB for live metrics
        const totalSubscribersRes = await pool.query(
            `SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'`
        );
        const activeSubscribers = parseInt(totalSubscribersRes.rows[0]?.count || '0', 10);

        const mrrRes = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as mrr FROM subscriptions WHERE status = 'active'`
        );
        const mrr = parseFloat(mrrRes.rows[0]?.mrr || '0');

        const totalRevenueRes = await pool.query(
            `SELECT COALESCE(SUM(amount_paid), 0) as total FROM invoices WHERE status = 'paid'`
        );
        const totalRevenue = parseFloat(totalRevenueRes.rows[0]?.total || '0');

        const planBreakdownRes = await pool.query(
            `SELECT plan_name, COUNT(*) as count, SUM(amount) as revenue FROM subscriptions WHERE status = 'active' GROUP BY plan_name`
        );
        const planBreakdown = planBreakdownRes.rows.map(row => ({
            planName: row.plan_name,
            count: parseInt(row.count, 10),
            revenue: parseFloat(row.revenue)
        }));

        const canceledSubscribersRes = await pool.query(
            `SELECT COUNT(*) as count FROM subscriptions WHERE status = 'canceled'`
        );
        const canceledCount = parseInt(canceledSubscribersRes.rows[0]?.count || '0', 10);
        const totalHistorical = activeSubscribers + canceledCount;
        const churnRate = totalHistorical > 0 ? ((canceledCount / totalHistorical) * 100).toFixed(1) : 0;

        const analyticsData = {
            activeSubscribers,
            mrr,
            arr: mrr * 12,
            totalRevenue,
            churnRate: `${churnRate}%`,
            planBreakdown,
            lastUpdated: new Date().toISOString(),
            isCached: false
        };

        // Set Redis Cache
        await redisClient.setex(CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(analyticsData));

        return analyticsData;
    } catch (err) {
        console.error('Error computing platform analytics:', err.message);
        throw err;
    }
}

export async function invalidateAnalyticsCache() {
    try {
        await redisClient.del(CACHE_KEY);
        console.log('Redis Analytics Cache invalidated successfully');
    } catch (err) {
        console.error('Failed to invalidate Redis cache:', err.message);
    }
}
