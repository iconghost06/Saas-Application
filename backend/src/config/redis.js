import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redisClient = new Redis({
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: null,
    retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
    }
});

redisClient.on('connect', () => {
    console.log(`Connected to Redis at ${redisHost}:${redisPort}`);
});

redisClient.on('error', (err) => {
    console.error('Redis Connection Error:', err.message);
});
