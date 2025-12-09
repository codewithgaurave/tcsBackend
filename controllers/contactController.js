import Contact from '../models/Contact.js';
import { successResponse, errorResponse } from '../utils/response.js';

// @desc    Create new contact inquiry
// @route   POST /api/contact
// @access  Public
export const createContact = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      message,
      subject,
    } = req.body;

    // Create contact
    const contact = await Contact.create({
      name,
      email,
      phone,
      company,
      subject,
      message,
    });

    return successResponse(
      res, 
      'Thank you for contacting Triveni Construction. We will get back to you soon.',
      { contact },
      201
    );

  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, 'Validation Error', 400, errors);
    }
    
    return errorResponse(res, 'Failed to submit contact form', 500);
  }
};

// @desc    Get all contact inquiries (with filters)
// @route   GET /api/contact
// @access  Private/Admin
export const getContacts = async (req, res) => {
  try {
    const {
      status,
      priority,
      projectType,
      source,
      assignedTo,
      page = 1,
      limit = 10,
      sort = '-createdAt',
      search
    } = req.query;

    // Build filter object
    let filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const contacts = await Contact.find(filter)
      .sort(sort)
      .limit(limitNum)
      .skip(skip);

    // Get total count for pagination
    const total = await Contact.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    return successResponse(res, 'Contacts fetched successfully', {
      contacts,
      pagination: {
        current: pageNum,
        total: totalPages,
        count: contacts.length,
        totalRecords: total
      }
    });

  } catch (error) {
    return errorResponse(res, 'Failed to fetch contacts', 500);
  }
};

// @desc    Get single contact inquiry
// @route   GET /api/contact/:id
// @access  Private/Admin
export const getContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('notes.addedBy', 'name');

    if (!contact) {
      return errorResponse(res, 'Contact inquiry not found', 404);
    }

    // Mark as read when fetched by admin
    if (!contact.isRead) {
      contact.isRead = true;
      await contact.save();
    }

    return successResponse(res, 'Contact fetched successfully', { contact });

  } catch (error) {
    return errorResponse(res, 'Failed to fetch contact', 500);
  }
};

// @desc    Update contact inquiry
// @route   PUT /api/contact/:id
// @access  Private/Admin
export const updateContact = async (req, res) => {
  try {
    const {
      status,
      priority,
      assignedTo,
      notes
    } = req.body;

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return errorResponse(res, 'Contact inquiry not found', 404);
    }

    // Update fields
    if (status) contact.status = status;
    if (priority) contact.priority = priority;
    if (assignedTo) contact.assignedTo = assignedTo;

    // Add note if provided
    if (notes && notes.note) {
      contact.notes.push({
        note: notes.note,
        addedBy: req.user._id
      });
    }

    await contact.save();

    const updatedContact = await Contact.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('notes.addedBy', 'name');

    return successResponse(res, 'Contact updated successfully', { 
      contact: updatedContact 
    });

  } catch (error) {
    return errorResponse(res, 'Failed to update contact', 500);
  }
};

// @desc    Delete contact inquiry
// @route   DELETE /api/contact/:id
// @access  Private/Admin
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return errorResponse(res, 'Contact inquiry not found', 404);
    }

    await Contact.findByIdAndDelete(req.params.id);

    return successResponse(res, 'Contact deleted successfully');

  } catch (error) {
    return errorResponse(res, 'Failed to delete contact', 500);
  }
};

// @desc    Get contact statistics
// @route   GET /api/contact/stats/overview
// @access  Private/Admin
export const getContactStats = async (req, res) => {
  try {
    const stats = await Contact.getStats();

    // Get recent contacts count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentContacts = await Contact.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get unread contacts count
    const unreadContacts = await Contact.countDocuments({ isRead: false });

    // Get high priority contacts count
    const highPriorityContacts = await Contact.countDocuments({ 
      priority: 'high' 
    });

    const enhancedStats = {
      ...stats,
      recent: recentContacts,
      unread: unreadContacts,
      highPriority: highPriorityContacts
    };

    return successResponse(res, 'Stats fetched successfully', { 
      stats: enhancedStats 
    });

  } catch (error) {
    return errorResponse(res, 'Failed to fetch stats', 500);
  }
};

// @desc    Add note to contact
// @route   POST /api/contact/:id/notes
// @access  Private/Admin
export const addNote = async (req, res) => {
  try {
    const { note } = req.body;

    if (!note) {
      return errorResponse(res, 'Note is required', 400);
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return errorResponse(res, 'Contact inquiry not found', 404);
    }

    contact.notes.push({
      note,
      addedBy: req.user._id
    });

    await contact.save();

    const updatedContact = await Contact.findById(req.params.id)
      .populate('notes.addedBy', 'name');

    return successResponse(res, 'Note added successfully', { 
      contact: updatedContact 
    });

  } catch (error) {
    return errorResponse(res, 'Failed to add note', 500);
  }
};

// @desc    Bulk update contacts status
// @route   PUT /api/contact/bulk/status
// @access  Private/Admin
export const bulkUpdateStatus = async (req, res) => {
  try {
    const { contactIds, status } = req.body;

    if (!contactIds || !contactIds.length || !status) {
      return errorResponse(res, 'Contact IDs and status are required', 400);
    }

    const result = await Contact.updateMany(
      { _id: { $in: contactIds } },
      { $set: { status } }
    );

    return successResponse(res, 'Contacts status updated successfully', {
      updatedCount: result.modifiedCount
    });

  } catch (error) {
    return errorResponse(res, 'Failed to update contacts status', 500);
  }
};