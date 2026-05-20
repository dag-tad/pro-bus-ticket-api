import { Redis } from '@upstash/redis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    const client = new Redis({
      url: process.env.REDIS_HOST,
      token: process.env.REDIS_TOKEN
      // port: Number(process.env.REDIS_PORT),
      // password: process.env.REDIS_PASSWORD || undefined,
      // lazyConnect: true,
      // maxRetriesPerRequest: 3,
    });

    // client.on('connect', () => {
    //   console.log('✅ Redis connected');
    // });

    // client.on('error', (err) => {
    //   console.error('❌ Redis error', err);
    // });

    return client;
  },
};
