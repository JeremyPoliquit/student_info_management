const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Make sure tama ang path ng db config

router.get("/student/:student_number", async (req, res) => {
  const { student_number } = req.params;
  const sql = `
        SELECT 
            s.student_id, s.student_number, s.student_name, 
            s.course, s.years, s.semester, 
            GROUP_CONCAT(DISTINCT CONCAT_WS('|', c.course_code, c.sched_day, c.durationIn, c.durationOut, c.room, c.professor) SEPARATOR ';') AS schedules,
            GROUP_CONCAT(DISTINCT CONCAT_WS('|', r.output, r.task, r.dates, r.scores) SEPARATOR ';') AS records
        FROM students s
        LEFT JOIN class_sched c ON s.student_id = c.student_id
        LEFT JOIN records r ON s.student_id = r.student_id
        WHERE s.student_number = ?
        GROUP BY s.student_id;
    `;

  try {
    const [results] = await db.query(sql, [student_number]); // Add await here
    if (results.length === 0)
      return res.status(404).json({ message: "Student not found" });

    const studentData = {
      student_id: results[0].student_id,
      student_number: results[0].student_number,
      student_name: results[0].student_name,
      course: results[0].course,
      years: results[0].years,
      semester: results[0].semester,
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

module.exports = router;
