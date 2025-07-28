import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis

// Create Prisma client with better error handling
export const db = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Test database connection on initialization
if (process.env.NODE_ENV === 'development') {
  db.$connect()
    .then(() => {
      console.log('✅ Database connected successfully')
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error.message)
    })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db 