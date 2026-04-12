const connection = require('../config/db');

exports.getStudents = async (req, res) => {
  try {
    const [results] = await connection.query("SELECT * FROM students");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const id = req.params.id;

    const [results] = await connection.query(
      "SELECT * FROM students WHERE id = ?",
      [id]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

exports.addStudent = async (req, res) => {
  try {
    const { name, age, branch, cgpa } = req.body;

    if (!name || !age || !branch || !cgpa) {
      return res.status(400).json({ error: "All fields required" });
    }

    const [result] = await connection.query(
      "INSERT INTO students (name, age, branch, cgpa) VALUES (?, ?, ?, ?)",
      [name, age, branch, cgpa]
    );

    res.status(201).json({ message: "Student added", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "Insert failed" });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, age, branch, cgpa } = req.body;

    await connection.query(
      "UPDATE students SET name=?, age=?, branch=?, cgpa=? WHERE id=?",
      [name, age, branch, cgpa, id]
    );

    res.json({ message: "Student updated" });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const id = req.params.id;

    await connection.query(
      "DELETE FROM students WHERE id = ?",
      [id]
    );

    res.json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};
