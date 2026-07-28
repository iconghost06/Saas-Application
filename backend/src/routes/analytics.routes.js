import express from 'express';
import { getPlatformAnalytics, invalidateAnalyticsCache } from '../services/analytics.service.js';

const router = express.Router();

router.get('/summary', async (req, res) => {
    try {
        const forceRefresh = req.query.refresh === 'true';
        const analytics = await getPlatformAnalytics(forceRefresh);
        res.json(analytics);
    } catch (err) {
        console.error('❌ Failed to fetch platform analytics:', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post('/refresh', async (req, res) => {
    try {
        await invalidateAnalyticsCache();
        const freshAnalytics = await getPlatformAnalytics(true);
        res.json({ success: true, message: 'Redis Cache invalidated & refreshed', analytics: freshAnalytics });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
