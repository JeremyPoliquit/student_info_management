const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Ensure the correct path for db config
const bcrypt = require("bcryptjs"); // For hashing the password
const jwt = require("jsonwebtoken"); // For generating JWT tokens

router.post("/student/create", async (req, res) => {
  const { student_number, student_name, course, years, semester, student_username, student_password, student_email } = req.body;

  // Hash the password
  const hashedPassword = await bcrypt.hash(student_password, 10);

  // Start transaction
  const connection = await db.getConnection(); // Get a connection from the pool
  await connection.beginTransaction(); // Begin MySQL transaction

  try {
      // 1. Insert into students table
      const [studentResult] = await connection.execute(
          "INSERT INTO students (student_number, student_name, course, years, semester) VALUES (?, ?, ?, ?, ?)",
          [student_number, student_name, course, years, semester]
      );

      // Get the last inserted student_id
      const student_id = studentResult.insertId;

      // 2. Insert into student_accounts table
      await connection.execute(
          "INSERT INTO student_accounts (student_id, student_username, student_password, student_email) VALUES (?, ?, ?, ?)",
          [student_id, student_username, hashedPassword, student_email]
      );

      // 3. Commit transaction
      await connection.commit();

      // 4. Generate JWT token
      const token = jwt.sign({ id: student_id, username: student_username }, "your_secret_key", { expiresIn: "1h" });

      res.status(201).json({ message: "Student registered successfully", token });

  } catch (error) {
      // If error, rollback transaction
      await connection.rollback();
      console.error(error);
      res.status(500).json({ message: "Error registering student", error });
  } finally {
      // Release connection
      connection.release();
  }
});

// POST route to create a record for a student
router.post("/record/create", async (req, res) => {
  const { student_number, output, task, dates, scores } = req.body;

  // Ensure all required fields are provided
  if (!student_number || !output || !task || !dates || !scores) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Find the student_id using student_number
  const findStudentSQL = `SELECT student_id FROM students WHERE student_number = ?`;
  try {
    const [studentResult] = await db.query(findStudentSQL, [student_number]);

    if (studentResult.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const student_id = studentResult[0].student_id;

    // Insert into records table
    const insertRecordSQL = `
        INSERT INTO records (output, task, dates, scores, student_id)
        VALUES (?, ?, ?, ?, ?)
      `;
    const recordValues = [output, task, dates, scores, student_id];

    // Insert the record
    await db.query(insertRecordSQL, recordValues);

    res.status(201).json({ message: "Record added successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

module.exports = router;
