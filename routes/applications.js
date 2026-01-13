import express from 'express';
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  updateApplicationStatus,
  getApplicationStats,
  downloadResume
} from '../controllers/applicationController.js';

import { validateApplication, validateApplicationUpdate } from '../middleware/validation.js';
import { upload } from '../utils/upload.js';
import { auth, admin } from '../middleware/auth.js';

const router = express.Router();

// Protected admin routes
router.get('/', auth, admin, getApplications);
router.get('/stats', auth, admin, getApplicationStats);
router.get('/:id', auth, admin, getApplicationById);
router.get('/:id/resume', auth, admin, downloadResume);
router.put('/:id', auth, admin, validateApplicationUpdate, updateApplication);
router.patch('/:id/status', auth, admin, updateApplicationStatus);
router.delete('/:id', auth, admin, deleteApplication);

// Public route for job applications
router.post('/', 
  upload.single('resume'),
  validateApplication,
  createApplication
);

export default router;