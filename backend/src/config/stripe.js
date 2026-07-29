import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = new Stripe(stripeSecretKey || 'sk_test_mock_key', {
    apiVersion: '2023-10-16',
});

export const isStripeConfigured = () => {
    return stripeSecretKey && stripeSecretKey.startsWith('sk_test_') && stripeSecretKey !== 'sk_test_mock_key';
};

console.log(isStripeConfigured() ? `Stripe SDK initialized with Test Secret Key (${stripeSecretKey.substring(0, 12)}...)` : 'Stripe SDK running in Simulated Test Mode fallback');
