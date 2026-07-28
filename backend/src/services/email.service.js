import nodemailer from 'nodemailer';
import { getEmailTransporter } from '../config/email.js';
import path from 'path';

export async function sendSubscriptionConfirmation({ userEmail, userName, planName, amount, currency = 'USD', invoicePath }) {
    try {
        const transporter = await getEmailTransporter();
        const fromAddress = process.env.EMAIL_FROM || 'SaaS Analytics Platform <noreply@saasplatform.com>';

        const mailOptions = {
            from: fromAddress,
            to: userEmail,
            subject: `🎉 Subscription Confirmed: Welcome to ${planName}!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #4f46e5;">Welcome to SaaS Analytics Platform!</h2>
                    <p>Hi <strong>${userName || 'Subscriber'}</strong>,</p>
                    <p>Thank you for subscribing to our <strong>${planName}</strong> plan.</p>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Plan:</strong> ${planName}</p>
                        <p style="margin: 5px 0;"><strong>Amount Paid:</strong> $${parseFloat(amount).toFixed(2)} ${currency.toUpperCase()}</p>
                        <p style="margin: 5px 0;"><strong>Status:</strong> Active</p>
                    </div>
                    <p>Your official payment invoice is attached to this email for your records.</p>
                    <p style="color: #64748b; font-size: 12px; margin-top: 30px;">SaaS Analytics Inc. &bull; All rights reserved.</p>
                </div>
            `,
            attachments: invoicePath ? [
                {
                    filename: path.basename(invoicePath),
                    path: invoicePath
                }
            ] : []
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Subscription Confirmation Email sent to ${userEmail}`);
        if (info && nodemailer.getTestMessageUrl(info)) {
            console.log(`🔗 Ethereal Email Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
        return info;
    } catch (err) {
        console.error(`❌ Failed to send confirmation email to ${userEmail}:`, err.message);
        throw err;
    }
}

export async function sendRenewalReminder({ userEmail, userName, planName, periodEnd }) {
    try {
        const transporter = await getEmailTransporter();
        const fromAddress = process.env.EMAIL_FROM || 'SaaS Analytics Platform <noreply@saasplatform.com>';
        const formattedDate = new Date(periodEnd).toLocaleDateString();

        const mailOptions = {
            from: fromAddress,
            to: userEmail,
            subject: `⏰ Upcoming Subscription Renewal - ${planName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #4f46e5;">Subscription Renewal Notice</h2>
                    <p>Hi <strong>${userName || 'Subscriber'}</strong>,</p>
                    <p>This is a quick reminder that your <strong>${planName}</strong> plan is scheduled to automatically renew on <strong>${formattedDate}</strong>.</p>
                    <p>No action is required if you wish to continue enjoying full access to SaaS Analytics Platform.</p>
                    <p style="color: #64748b; font-size: 12px; margin-top: 30px;">If you have any questions, contact support@saasanalytics.com.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`⏰ Renewal Reminder Email sent to ${userEmail}`);
        if (info && nodemailer.getTestMessageUrl(info)) {
            console.log(`🔗 Renewal Email Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
        return info;
    } catch (err) {
        console.error(`❌ Failed to send renewal reminder to ${userEmail}:`, err.message);
        throw err;
    }
}
