import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use gemini-1.5-flash as a fallback if gemini-2.5-flash-lite isn't available
const modelName = 'gemini-1.5-flash'; 

router.post('/question', async (req, res) => {
  const { complaint_text } = req.body;

  if (!complaint_text) {
    return res.status(400).json({ message: 'Complaint text is required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `A user has submitted the following complaint: "${complaint_text}". 
    Generate exactly one short, relevant follow-up question to help understand the situation better. 
    Return only the question text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    res.json({ question: text });
  } catch (error) {
    console.error('Gemini Error:', error);
    res.status(500).json({ message: 'Error generating AI question' });
  }
});

export default router;
