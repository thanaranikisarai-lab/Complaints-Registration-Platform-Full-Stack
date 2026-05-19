import express from 'express';
import { db } from '../db/index.js';
import { complaints, users } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// POST /api/complaints - Public Submission
router.post('/', async (req, res) => {
  const { name, city, mobile, complaint } = req.body;

  if (!name || !city || !mobile || !complaint) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const [newComplaint] = await db.insert(complaints).values({
      name,
      city,
      mobile,
      complaint,
    }).returning();

    res.json(newComplaint);
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ message: 'Failed to submit complaint' });
  }
});

// GET /api/complaints/my - Fetch complaints for logged in user
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const myComplaints = await db.select()
      .from(complaints)
      .where(eq(complaints.name, req.user.name))
      .orderBy(desc(complaints.createdAt));

    res.json(myComplaints);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch your complaints' });
  }
});

// GET /api/complaints/all - Admin Only
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const allComplaints = await db.select()
      .from(complaints)
      .orderBy(desc(complaints.createdAt));

    res.json(allComplaints);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch all complaints' });
  }
});

export default router;
