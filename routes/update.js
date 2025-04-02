const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Ensure the correct path

// Update a record
router.put("/record/update/:record_id", async (req, res) => {
  const { record_id } = req.params;
  const { subjects, task, dates, scores } = req.body; // Fixed: changed `subjects` to `output`

  // Ensure at least one field is provided
  if (!subjects && !task && !dates && !scores) {
    return res.status(400).json({ message: "At least one field must be provided to update." });
  }

  let updates = [];
  let values = [];

  if (subjects) {
    updates.push("output = ?");
    values.push(subjects);
  }
  if (task) {
    updates.push("task = ?");
    values.push(task);
  }
  if (dates) {
    updates.push("dates = ?");
    values.push(dates);
  }
  if (scores) {
    updates.push("scores = ?");
    values.push(scores);
  }

  values.push(record_id); // Add record_id for WHERE condition

  const updateSQL = `UPDATE records SET ${updates.join(", ")} WHERE record_id = ?`;

  try {
    const [result] = await db.query(updateSQL, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Record not found." });
    }

    res.json({ message: "Record updated successfully!" });
  } catch (err) {
    console.error(err); // Log the error
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

module.exports = router;
