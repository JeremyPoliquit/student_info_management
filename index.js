require("dotenv").config();
const cors = require('cors');
const express = require("express");

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Import routes
const readRoute = require("./routes/read");

// Use routes
app.use("/api", readRoute); // This will be the base route for student-related endpoints

// Server running
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
