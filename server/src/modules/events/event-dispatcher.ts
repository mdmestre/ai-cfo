import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // Allow it to keep trying in background
    enableReadyCheck: false,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

redis.on('error', (err) => {
    // Log once, then stay quiet unless it's a new type of error
    console.warn('[events]: Redis connection failed. Events will be queued/dropped until Redis is available.');
});

export class EventDispatcher {
    async dispatch(streamName: string, eventDetails: Record<string, any>) {
        try {
            await redis.xadd(streamName, '*', 'data', JSON.stringify({
                ...eventDetails,
                timestamp: new Date().toISOString()
            }));
            console.log(`[events]: Event dispatched to stream ${streamName}`);
        } catch (error) {
            console.error(`[events]: Failed to dispatch event to ${streamName}`, error);
        }
    }

    // High-level event helpers
    async dispatchTransactionCreated(transactionId: string, companyId: string, type: string) {
        await this.dispatch('transaction_events', {
            action: 'transaction.created',
            transactionId,
            companyId,
            type
        });
    }

    async dispatchPixReceived(paymentId: string, companyId: string, amount: number) {
        await this.dispatch('payment_events', {
            action: 'pix.received',
            paymentId,
            companyId,
            amount
        });
    }
}

export const eventDispatcher = new EventDispatcher();
export default redis;
