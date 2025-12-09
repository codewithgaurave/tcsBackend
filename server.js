import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/database.js";
import app from "./app.js";
const PORT = process.env.PORT || 4041;
connectDB();

app.listen(PORT, () => {
  console.log(`Triveni Construction Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
