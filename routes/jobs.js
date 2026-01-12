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
import { auth, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveJobs);

// Protected routes - require authentication and admin role
router.get('/', auth, admin, getJobs);
router.get('/stats', auth, admin, getJobStats);
router.get('/:id', auth, admin, getJobById);
router.post('/', auth, admin, validateJob, createJob);
router.put('/:id', auth, admin, validateJobUpdate, updateJob);
router.patch('/:id/status', auth, admin, updateJobStatus);
router.delete('/:id', auth, admin, deleteJob);

export default router;