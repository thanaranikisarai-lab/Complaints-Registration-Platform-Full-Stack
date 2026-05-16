import { pgTable, serial, text, varchar, timestamp, boolean, integer, bigint } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(), // Plain text as requested
  role: varchar('role', { length: 20 }).notNull().default('user'), // 'user' or 'admin'
  otp: varchar('otp', { length: 6 }),
  otpExpiry: timestamp('otp_expiry'),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const complaints = pgTable('complaints', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  mobile: text('mobile').notNull(),
  complaint: text('complaint').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
