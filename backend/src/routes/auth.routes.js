import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// Register new client user
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email address' });
        }

        const newUser = await pool.query(
            `INSERT INTO users (email, password_hash, name, role) 
             VALUES ($1, $2, $3, 'client') RETURNING id, email, name, role, created_at`,
            [email, password, name || 'SaaS Client']
        );

        res.json({ success: true, user: newUser.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login for client or admin
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];
        if (user.password_hash !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const userPayload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        };

        res.json({ success: true, user: userPayload });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
