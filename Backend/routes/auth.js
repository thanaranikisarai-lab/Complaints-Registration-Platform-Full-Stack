import express from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Middleware to verify JWT
export const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden' });
    req.user = user;
    next();
  });
};

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  const { name, email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    if (existingUser) {
      await db.update(users).set({ otp, otpExpiry: expiry, name }).where(eq(users.id, existingUser.id));
    } else {
      await db.insert(users).values({ name, email, otp, otpExpiry: expiry, password: 'pending' });
    }

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Your OTP for Complaint Platform',
      text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
    });

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending OTP' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, otp, password } = req.body;

  try {
    const user = await db.query.users.findFirst({
      where: and(eq(users.email, email), eq(users.otp, otp)),
    });

    if (!user || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await db.update(users).set({
      password, // Stored as plain text per requirements
      isVerified: true,
      otp: null,
      otpExpiry: null
    }).where(eq(users.id, user.id));

    res.json({ success: true, message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.query.users.findFirst({
      where: and(eq(users.email, email), eq(users.password, password), eq(users.isVerified, true)),
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials or unverified account' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET);

    res.cookie('token', token, {
      httpOnly: false, // Per requirements
      secure: false,   // Per requirements
      sameSite: 'lax'
    });

    res.json({ name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({ name: req.user.name, email: req.user.email, role: req.user.role });
});

export default router;
