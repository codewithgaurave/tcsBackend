import express from 'express';
import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  updateJobStatus,
  getActiveJobs,
  getJobStats
} from '../controllers/jobController.js';

import { validateJob, validateJobUpdate } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveJobs);

// Protected routes (add auth middleware as needed)
router.get('/', getJobs);
router.get('/stats', getJobStats);
router.get('/:id', getJobById);
router.post('/', validateJob, createJob);
router.put('/:id', validateJobUpdate, updateJob);
router.patch('/:id/status', updateJobStatus);
router.delete('/:id', deleteJob);

export default router;