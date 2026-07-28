import app from './app.js';
import { initDb } from './config/db.js';
import { startSubscriptionScheduler } from './services/scheduler.service.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function bootstrap() {
    try {
        console.log('🚀 Bootstrapping SaaS Analytics Backend Server...');

        // 1. Initialize DB schema
        await initDb();

        // 2. Start Cron Scheduler for expiring subscriptions
        startSubscriptionScheduler();

        // 3. Start Express Server
        app.listen(PORT, () => {
            console.log(`✨ Backend API Server listening at http://localhost:${PORT}`);
            console.log(`🤖 MCP HTTP Bridge endpoint available at http://localhost:${PORT}/api/mcp/execute`);
        });
    } catch (err) {
        console.error('❌ Bootstrap failure:', err);
        process.exit(1);
    }
}

bootstrap();
