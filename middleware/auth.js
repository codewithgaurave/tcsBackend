import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { errorResponse } from '../utils/response.js';
1
export const auth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 'Access denied. No token provided.', 401);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded);
      
      const user = await User.findById(decoded.id);

      if (!user) {
        return errorResponse(res, 'User not found', 401);
      }

      if (!user.isActive) {
        return errorResponse(res, 'User account is deactivated', 401);
      }

      req.user = user;
      next();
    } catch (jwtError) {
      return errorResponse(res, 'Invalid or expired token', 401);
    }

  } catch (error) {
    return errorResponse(res, 'Authentication failed', 500);
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return errorResponse(res, 'Access denied. Admin role required.', 403);
  }
};