import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
// Import routes
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from './routes/contactRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import dashboardRoutes from './routes/dashboardRoutes.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Logging
app.use(morgan("combined"));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/jobs", jobRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Triveni Construction Backend is running smoothly",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error Stack:", err.stack);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export default app;
