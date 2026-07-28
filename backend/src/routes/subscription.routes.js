import express from 'express';
import { pool } from '../config/db.js';
import { checkAndProcessExpiringSubscriptions } from '../services/scheduler.service.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

router.get('/list', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.id, s.plan_name, s.amount, s.currency, s.status, 
                s.current_period_start, s.current_period_end, s.created_at,
                u.email as user_email, u.name as user_name
            FROM subscriptions s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/trigger-cron-check', async (req, res) => {
    try {
        const count = await checkAndProcessExpiringSubscriptions();
        res.json({ success: true, processedCount: count, message: `Processed ${count} expiring subscriptions` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/invoices', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                i.id, i.amount_paid, i.currency, i.pdf_path, i.status, i.created_at,
                s.plan_name, u.email as user_email, u.name as user_name
            FROM invoices i
            JOIN users u ON i.user_id = u.id
            LEFT JOIN subscriptions s ON i.subscription_id = s.id
            ORDER BY i.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/invoices/:id/download', async (req, res) => {
    try {
        const invoiceId = req.params.id;
        const result = await pool.query('SELECT pdf_path FROM invoices WHERE id = $1', [invoiceId]);
        if (result.rows.length === 0 || !result.rows[0].pdf_path) {
            return res.status(404).json({ error: 'Invoice PDF not found' });
        }

        const filePath = result.rows[0].pdf_path;
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File does not exist on disk' });
        }

        res.download(filePath, path.basename(filePath));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
