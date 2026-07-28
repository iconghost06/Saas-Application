import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storageDir = path.join(__dirname, '../../storage/invoices');

if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
}

export async function generateInvoicePDF({ invoiceId, userEmail, userName, planName, amount, currency = 'USD', paymentDate = new Date() }) {
    return new Promise((resolve, reject) => {
        try {
            const fileName = `Invoice_${invoiceId}_${Date.now()}.pdf`;
            const filePath = path.join(storageDir, fileName);
            const doc = new PDFDocument({ margin: 50 });

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // --- Header ---
            doc.fillColor('#6366f1').fontSize(24).text('SaaS Analytics Platform', 50, 45);
            doc.fillColor('#64748b').fontSize(10).text('100 Innovation Way, Tech City, CA', 50, 75);
            doc.text('support@saasanalytics.com', 50, 90);

            // --- Invoice Title ---
            doc.fillColor('#0f172a').fontSize(20).text('INVOICE', 400, 45, { align: 'right' });
            doc.fillColor('#64748b').fontSize(10).text(`Invoice #: INV-${invoiceId}`, 400, 75, { align: 'right' });
            doc.text(`Date: ${paymentDate.toLocaleDateString()}`, 400, 90, { align: 'right' });
            doc.text(`Status: PAID`, 400, 105, { align: 'right' });

            doc.moveTo(50, 130).lineTo(550, 130).strokeColor('#e2e8f0').stroke();

            // --- Bill To ---
            doc.fillColor('#0f172a').fontSize(12).text('Billed To:', 50, 145);
            doc.fillColor('#334155').fontSize(10).text(userName || 'Valued Subscriber', 50, 165);
            doc.text(userEmail, 50, 180);

            // --- Table Header ---
            const tableTop = 220;
            doc.fillColor('#f8fafc').rect(50, tableTop, 500, 25).fill();
            doc.fillColor('#475569').fontSize(10).text('Description', 60, tableTop + 7);
            doc.text('Qty', 350, tableTop + 7, { align: 'center' });
            doc.text('Amount', 450, tableTop + 7, { align: 'right' });

            // --- Table Content ---
            const itemTop = tableTop + 35;
            doc.fillColor('#0f172a').fontSize(10).text(`Subscription Plan: ${planName}`, 60, itemTop);
            doc.text('1', 350, itemTop, { align: 'center' });
            doc.text(`$${parseFloat(amount).toFixed(2)} ${currency.toUpperCase()}`, 450, itemTop, { align: 'right' });

            doc.moveTo(50, itemTop + 25).lineTo(550, itemTop + 25).strokeColor('#e2e8f0').stroke();

            // --- Total ---
            const totalTop = itemTop + 40;
            doc.fillColor('#0f172a').fontSize(12).text('Total Paid:', 350, totalTop);
            doc.fillColor('#4f46e5').fontSize(14).text(`$${parseFloat(amount).toFixed(2)} ${currency.toUpperCase()}`, 450, totalTop, { align: 'right' });

            // --- Footer ---
            doc.fillColor('#94a3b8').fontSize(9).text('Thank you for subscribing to SaaS Analytics Platform!', 50, 680, { align: 'center', width: 500 });

            doc.end();

            stream.on('finish', () => {
                resolve({ fileName, filePath });
            });

            stream.on('error', (err) => {
                reject(err);
            });
        } catch (err) {
            reject(err);
        }
    });
}
