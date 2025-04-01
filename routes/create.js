const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/create
router.post("/create", async(req, res) => {
    try {
        const { student_number, student_name, student_course } = req.body;

        const sql = "INSERT INTO students (student_number, student_name, student_course) VALUES (?, ?, ?)";
        const value = [ student_number, student_name, student_course ];

        const result = await db.query(sql, value);

        res.status(201).json({ message: "Student added successfully", studentId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})


module.exports = router;