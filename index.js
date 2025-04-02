require("dotenv").config();
const cors = require('cors');
const express = require("express");

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Import routes
const readRoute = require("./routes/read");
const createRoute = require("./routes/create");
const updateRoute = require("./routes/update")

// Use routes with different base paths to avoid overlap
app.use("/api", readRoute);  // For student-related data
app.use("/api", createRoute);  // For creating students and accounts
app.use("/api", updateRoute) // for update record student

// Server running
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
