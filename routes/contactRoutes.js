import express from 'express';
import {
  createContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
  getContactStats,
  addNote,
  bulkUpdateStatus
} from '../controllers/contactController.js';
import { auth, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/', createContact);

// Protected admin routes  
router.get('/', getContacts); // Temporarily removed auth for testing
router.get('/stats/overview', auth, admin, getContactStats);
router.get('/:id', auth, admin, getContact);
router.put('/:id', auth, admin, updateContact);
router.delete('/:id', deleteContact); // Temporarily removed auth for testing
router.post('/:id/notes', auth, admin, addNote);
router.put('/bulk/status', auth, admin, bulkUpdateStatus);

export default router;