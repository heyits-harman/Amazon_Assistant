import { Router } from 'express';
import { analyzeReviews } from '../controllers/analyzeController';

const router = Router();

router.post('/analyze', analyzeReviews);

export default router;