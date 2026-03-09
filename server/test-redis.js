const Redis = require('ioredis');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
console.log('Testing connection to Redis:', redisUrl);

const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
        if (times > 1) return null; // stop retrying
        return 50;
    }
});

redis.on('error', (err) => {
    console.error('Redis error:', err);
    process.exit(1);
});

redis.ping((err, res) => {
    if (err) {
        console.error('Ping error:', err);
    } else {
        console.log('Ping successful:', res);
    }
    redis.quit();
});
