import mongoose from 'mongoose';
import { env } from './env';

export async function connectDb(): Promise<void> {
  if (!env.mongoUri) return;
  for (let attempt = 1; ; attempt++) {
    try {
      await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
      console.log('mongo connected');
      return;
    } catch (err) {
      console.error(`mongo connection attempt ${attempt} failed:`, err instanceof Error ? err.message : err);
      if (attempt >= 10) {
        console.error('mongo: giving up after 10 attempts — the server stays up, but DB features will not work.');
        return;
      }
      await new Promise((r) => setTimeout(r, Math.min(attempt * 2000, 15000)));
    }
  }
}
