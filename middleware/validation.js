import { body, validationResult } from 'express-validator';


// Job validation rules
export const validateJob = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Job title is required')
    .isLength({ max: 100 })
    .withMessage('Job title cannot exceed 100 characters'),
  
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required'),
  
  body('type')
    .isIn(['Full-time', 'Part-time', 'Contract', 'Internship'])
    .withMessage('Invalid job type'),
  
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),
  
  body('experience')
    .trim()
    .notEmpty()
    .withMessage('Experience is required'),
  
  body('salary')
    .trim()
    .notEmpty()
    .withMessage('Salary information is required'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Job description is required'),
  
  body('requirements')
    .isArray({ min: 1 })
    .withMessage('At least one requirement is required'),
  
  body('status')
    .optional()
    .isIn(['active', 'draft', 'closed'])
    .withMessage('Invalid status'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Application validation rules
export const validateApplication = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  
  body('jobId')
    .notEmpty()
    .withMessage('Job ID is required'),
  
  body('experience')
    .trim()
    .notEmpty()
    .withMessage('Experience is required'),
  
  body('expectedSalary')
    .trim()
    .notEmpty()
    .withMessage('Expected salary is required'),
  
  body('noticePeriod')
    .trim()
    .notEmpty()
    .withMessage('Notice period is required'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateJobUpdate = validateJob;
export const validateApplicationUpdate = validateApplication;