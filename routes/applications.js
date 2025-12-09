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

const router = express.Router();

router.get('/', getApplications);
router.get('/stats', getApplicationStats);
router.get('/:id', getApplicationById);
router.get('/:id/resume', downloadResume);

// File upload middleware for resume
router.post('/', 
  upload.single('resume'),
  validateApplication,
  createApplication
);

router.put('/:id', validateApplicationUpdate, updateApplication);
router.patch('/:id/status', updateApplicationStatus);
router.delete('/:id', deleteApplication);

export default router;