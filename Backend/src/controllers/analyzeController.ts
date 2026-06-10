import { Request, Response } from 'express';
import { getAnalysis } from '../services/geminiService';
import Analysis from '../models/Analysis';
import { Review, UserProfile } from '../types';

export async function analyzeReviews(req: Request, res: Response): Promise<void> {
  try {
    const { asin, reviews, userProfile }: { 
      asin: string; 
      reviews: Review[]; 
      userProfile: UserProfile 
    } = req.body;

    if (!asin || !reviews || !userProfile) {
      res.status(400).json({ error: 'asin, reviews and userProfile are required' });
      return;
    }

    if (reviews.length === 0) {
      res.status(400).json({ error: 'No reviews provided' });
      return;
    }

    console.log(`Analyzing ${reviews.length} reviews for ASIN: ${asin}`);

    const analysis = await getAnalysis(reviews, userProfile, asin);

    await Analysis.create({ asin, analysis, userProfile });

    res.status(200).json({ analysis });

  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}