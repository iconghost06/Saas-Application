import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config();

let transporter = null;

export async function getEmailTransporter() {
    if (transporter) return transporter;

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const isCustomSmtp = host && user && pass;

    if (isCustomSmtp) {
        transporter = nodemailer.createTransport({
            host,
            port: parseInt(process.env.SMTP_PORT || '2525', 10),
            auth: { user, pass }
        });
        console.log(`Nodemailer connected to Mailtrap Sandbox SMTP (${host}:${process.env.SMTP_PORT || 2525})`);
    } else {
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            console.log(`Nodemailer connected to Ethereal Email Test Account (${testAccount.user})`);
        } catch (err) {
            console.warn('Could not create Ethereal test account, using JSON transport fallback:', err.message);
            transporter = nodemailer.createTransport({ jsonTransport: true });
        }
    }

    return transporter;
}
