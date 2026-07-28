import { Queue, Worker } from 'bullmq';
import { redisClient } from '../config/redis.js';
import { sendRenewalReminder } from './email.service.js';

const QUEUE_NAME = 'subscription-reminders';

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10)
};

export const renewalQueue = new Queue(QUEUE_NAME, { connection });

export const renewalWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
        const { userEmail, userName, planName, periodEnd } = job.data;
        console.log(`📌 BullMQ Worker processing renewal job #${job.id} for ${userEmail}`);
        await sendRenewalReminder({ userEmail, userName, planName, periodEnd });
        return { status: 'sent', userEmail };
    },
    { connection }
);

renewalWorker.on('completed', (job, result) => {
    console.log(`✅ BullMQ Renewal job #${job.id} completed:`, result);
});

renewalWorker.on('failed', (job, err) => {
    console.error(`❌ BullMQ Renewal job #${job?.id} failed:`, err.message);
});

export async function enqueueRenewalReminder(payload) {
    try {
        const job = await renewalQueue.add('send-renewal-email', payload, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            }
        });
        console.log(`🚀 Renewal reminder job #${job.id} enqueued for ${payload.userEmail}`);
        return job;
    } catch (err) {
        console.error('❌ Failed to enqueue renewal reminder job:', err.message);
        throw err;
    }
}
