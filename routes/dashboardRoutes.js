import express from 'express';
import {
  getDashboardCounts
} from '../controllers/dashboardController.js';

const router = express.Router();

// Single endpoint for all dashboard data
router.get('/counts', getDashboardCounts);

export default router;