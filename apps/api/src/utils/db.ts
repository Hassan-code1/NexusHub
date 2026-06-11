
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env';
import { logger } from '../config/logger';

// Instantiate the modern Postgres adapter
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

// Pass the adapter directly into the Prisma Client
const prisma = new PrismaClient({ adapter });

export const verifyDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    
    // Extract host for safe logging
    const dbUrl = env.DATABASE_URL;
    const hostStr = dbUrl.includes('@') ? dbUrl.split('@')[1].split('/')[0] : 'unknown-host';
    
    logger.info(`Database connected successfully via adapter to host: ${hostStr}`);
    
    return {
      status: 'connected',
      userCount,
      host: hostStr
    };
  } catch (error) {
    logger.error('Failed to connect to the database', error);
    process.exit(1);
  }
};

export default prisma;