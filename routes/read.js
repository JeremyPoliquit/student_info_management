const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware")

// Protected route to get student profile using JWT
router.get("/profile", authenticateToken, async (req, res) => {
  const student_id = req.user.id; // Extract student_id from token

  const sql = `
      SELECT 
          s.student_id, s.student_number, s.student_name, 
          s.course, s.years, s.semester, 
          a.student_username, a.student_email,
          GROUP_CONCAT(DISTINCT CONCAT_WS('|', c.course_code, c.sched_day, c.durationIn, c.durationOut, c.room, c.professor) SEPARATOR ';') AS schedules,
          GROUP_CONCAT(DISTINCT CONCAT_WS('|', r.output, r.task, r.dates, r.scores) SEPARATOR ';') AS records
      FROM students s
      LEFT JOIN student_accounts a ON s.student_id = a.student_id
      LEFT JOIN class_sched c ON s.student_id = c.student_id
      LEFT JOIN records r ON s.student_id = r.student_id
      WHERE s.student_id = ?
      GROUP BY s.student_id, a.student_username, a.student_email
  `;

  try {
      const [results] = await db.query(sql, [student_id]);
      if (results.length === 0) return res.status(404).json({ message: "Student not found" });

      // Format response
      const studentData = {
          student_id: results[0].student_id,
          student_number: results[0].student_number,
          student_name: results[0].student_name,
          course: results[0].course,
          years: results[0].years,
          semester: results[0].semester,
          username: results[0].student_username,
          email: results[0].student_email,
          schedules: results[0].schedules
              ? results[0].schedules.split(";").map((s) => {
                  const [course_code, sched_day, durationIn, durationOut, room, professor] = s.split("|");
                  return { course_code, sched_day, durationIn, durationOut, room, professor };
              })
              : [],
          records: results[0].records
              ? results[0].records.split(";").map((r) => {
                  const [output, task, dates, scores] = r.split("|");
                  return { output, task, dates, scores };
              })
              : [],
      };

      res.json(studentData);
  } catch (err) {
      res.status(500).json({ message: "Database error", error: err.message });
  }
});


// GET route to fetch all students and their account information
router.get("/students", async (req, res) => {
  const sql = `
    SELECT 
      s.student_id,
      s.student_number,
      s.student_name,
      s.course,
      s.years,
      s.semester,
      sa.student_username,
      sa.student_email,
      sa.created_at
    FROM students s
    JOIN student_accounts sa ON s.student_id = sa.student_id;
  `;

  try {
    const [results] = await db.query(sql);

    if (results.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

router.get("/student/:student_number", async (req, res) => {
  const { student_number } = req.params;
  const sql = `
        SELECT 
            s.student_id, s.student_number, s.student_name, 
            s.course, s.years, s.semester, 
            a.student_username, a.student_email,  -- FIXED column names
            GROUP_CONCAT(DISTINCT CONCAT_WS('|', c.course_code, c.sched_day, c.durationIn, c.durationOut, c.room, c.professor) SEPARATOR ';') AS schedules,
            GROUP_CONCAT(DISTINCT CONCAT_WS('|', r.output, r.task, r.dates, r.scores) SEPARATOR ';') AS records
        FROM students s
        LEFT JOIN student_accounts a ON s.student_id = a.student_id  -- FIXED table join
        LEFT JOIN class_sched c ON s.student_id = c.student_id
        LEFT JOIN records r ON s.student_id = r.student_id
        WHERE s.student_number = ?
        GROUP BY s.student_id, a.student_username, a.student_email;
    `;

  try {
    const [results] = await db.query(sql, [student_number]);
    if (results.length === 0)
      return res.status(404).json({ message: "Student not found" });

    const studentData = {
      student_id: results[0].student_id,
      student_number: results[0].student_number,
      student_name: results[0].student_name,
      course: results[0].course,
      years: results[0].years,
      semester: results[0].semester,
      username: results[0].student_username, // FIXED
      email: results[0].student_email, // FIXED
      schedules: results[0].schedules
        ? results[0].schedules.split(";").map((s) => {
            const [
              course_code,
              sched_day,
              durationIn,
              durationOut,
              room,
              professor,
            ] = s.split("|");
            return {
              course_code,
              sched_day,
              durationIn,
              durationOut,
              room,
              professor,
            };
          })
        : [],
      records: results[0].records
        ? results[0].records.split(";").map((r) => {
            const [output, task, dates, scores] = r.split("|");
            return { output, task, dates, scores };
          })
        : [],
    };

    res.json(studentData);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

router.get("/student/records/:student_number", async (req, res) => {
  const { student_number } = req.params;

  const sql = `
    SELECT 
      s.student_number,
      GROUP_CONCAT(DISTINCT CONCAT_WS('|', r.output, r.task, r.dates, r.scores) SEPARATOR ';') AS records
    FROM students s
    LEFT JOIN records r ON s.student_id = r.student_id
    WHERE s.student_number = ?
    GROUP BY s.student_id;
  `;

  try {
    const [results] = await db.query(sql, [student_number]); // Using student_number to filter
    if (results.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Format the result into a simplified object with student_number and records
    const studentData = {
      student_number: results[0].student_number,
      records: results[0].records
        ? results[0].records.split(";").map((r) => {
            const [output, task, dates, scores] = r.split("|");
            return { output, task, dates, scores };
          })
        : [],
    };

    res.json(studentData); // Return only student_number and records
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
});


module.exports = router;
