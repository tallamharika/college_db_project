const express = require('express');
const router = express.Router();
const multer = require('multer');
const ExcelJS = require('exceljs');
const csrf = require('csurf');
const isAdmin = require('../middleware/isAdmin');
const connection = require('../config/db');
const csrfProtection = csrf();

/* =====================
   VALIDATION FUNCTION
===================== */
function validateStudent({ name, age, branch, cgpa }) {

  if (!name || !age || !branch || !cgpa) {
    return "All fields are required.";
  }

  // 🔥 convert to number
  const ageNum = Number(age);
  const cgpaNum = Number(cgpa);

  // 🔥 check if conversion failed
  if (isNaN(ageNum) || isNaN(cgpaNum)) {
    return "Age and CGPA must be valid numbers.";
  }

  if (ageNum < 16 || ageNum > 60) {
    return "Age must be between 16 and 60.";
  }

  if (cgpaNum < 0 || cgpaNum > 10) {
    return "CGPA must be between 0 and 10.";
  }

  return null;
}

/* =====================
   MULTER CONFIG
===================== */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPG, JPEG, PNG files allowed'));
    }

    cb(null, true);
  },
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

/* =====================
   HOME ROUTE
===================== */
/*router.get('/', isAdmin, csrfProtection, (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  const search = req.query.search;
  const branch = req.query.branch;
  const sort = req.query.sort;

  let sql = "SELECT * FROM students WHERE 1=1";
  let values = [];

  if (search) {
    sql += " AND name LIKE ?";
    values.push(`%${search}%`);
  }

  if (branch) {
    sql += " AND branch = ?";
    values.push(branch);
  }

  if (sort === 'cgpa_desc') {
    sql += " ORDER BY cgpa DESC";
  } else if (sort === 'cgpa_asc') {
    sql += " ORDER BY cgpa ASC";
  } else {
    sql += " ORDER BY id DESC";
  }

  sql += " LIMIT ? OFFSET ?";
  values.push(limit, offset);

  connection.query(sql, values, (err, students) => {
    if (err) return res.send("Error");

    let countSql = "SELECT COUNT(*) as count FROM students WHERE 1=1";
    let countValues = [];

    if (search) {
      countSql += " AND name LIKE ?";
      countValues.push(`%${search}%`);
    }

    if (branch) {
      countSql += " AND branch = ?";
      countValues.push(branch);
    }

    connection.query(countSql, countValues, (err, countResult) => {
  if (err) return res.send("Error");

  const total = countResult[0].count;
  const totalPages = Math.ceil(total / limit);

  // 👇 MOVE THIS ABOVE render
  let chartSql = "SELECT branch, COUNT(*) as count FROM students WHERE 1=1";
let chartValues = [];

if (search) {
  chartSql += " AND name LIKE ?";
  chartValues.push(`%${search}%`);
}

if (branch) {
  chartSql += " AND branch = ?";
  chartValues.push(branch);
}

chartSql += " GROUP BY branch";

connection.query(chartSql, chartValues, (err, chartData) => {
  if (err) return res.send("Error");

  let cse = 0, ece = 0, mech = 0;

  chartData.forEach(row => {
    if (row.branch === "CSE") cse = row.count;
    if (row.branch === "ECE") ece = row.count;
    if (row.branch === "MECH") mech = row.count;
  });

  res.render('index', {
    students,
    cse,
    ece,
    mech,
    search,
    branch,
    sort,
    total,
    page,
    totalPages,
    csrfToken: req.csrfToken(),
    session: req.session
  });
});
});
  });
});

router.get('/', isAdmin, csrfProtection, (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  const search = req.query.search;
  const branch = req.query.branch;
  const sort = req.query.sort;

  let sql = "SELECT * FROM students WHERE 1=1";
  let values = [];

  if (search) {
    sql += " AND name LIKE ?";
    values.push(`%${search}%`);
  }

  if (branch) {
    sql += " AND branch = ?";
    values.push(branch);
  }

  if (sort === 'cgpa_desc') {
    sql += " ORDER BY cgpa DESC";
  } else if (sort === 'cgpa_asc') {
    sql += " ORDER BY cgpa ASC";
  } else {
    sql += " ORDER BY id DESC";
  }

  sql += " LIMIT ? OFFSET ?";
  values.push(limit, offset);

  connection.query(sql, values, (err, students) => {
    if (err) return res.send("Error");

    let countSql = "SELECT COUNT(*) as count FROM students WHERE 1=1";
    let countValues = [];

    if (search) {
      countSql += " AND name LIKE ?";
      countValues.push(`%${search}%`);
    }

    if (branch) {
      countSql += " AND branch = ?";
      countValues.push(branch);
    }

    connection.query(countSql, countValues, (err, countResult) => {
      if (err) return res.send("Error");

      const total = countResult[0].count;
      const totalPages = Math.ceil(total / limit);

      let chartSql = "SELECT branch, COUNT(*) as count FROM students WHERE 1=1";
      let chartValues = [];

      if (search) {
        chartSql += " AND name LIKE ?";
        chartValues.push(`%${search}%`);
      }

      if (branch) {
        chartSql += " AND branch = ?";
        chartValues.push(branch);
      }

      chartSql += " GROUP BY branch";

      connection.query(chartSql, chartValues, (err, chartData) => {
        if (err) return res.send("Error");

        let cse = 0, ece = 0, mech = 0;

        chartData.forEach(row => {
          if (row.branch === "CSE") cse = row.count;
          if (row.branch === "ECE") ece = row.count;
          if (row.branch === "MECH") mech = row.count;
        });

        res.render('index', {
          students,
          cse,
          ece,
          mech,
          search,
          branch,
          sort,
          total,
          page,
          totalPages,
          csrfToken: req.csrfToken(),
          session: req.session
        });

      });

    });

  });

});
*/
router.get('/', isAdmin, csrfProtection, async (req, res) => {

  try {

    const page = parseInt(req.query.page) || 1;
    if (page < 1) {
  return res.redirect('/?page=1');
}
    const limit = 5;
    const offset = (page - 1) * limit;

    const search = req.query.search;
    const branch = req.query.branch;
    const sort = req.query.sort;

    let baseQuery = "FROM students WHERE 1=1";
    let values = [];

    if (search) {
      baseQuery += " AND name LIKE ?";
      values.push(`%${search}%`);
    }

    if (branch) {
      baseQuery += " AND branch = ?";
      values.push(branch);
    }

    let orderBy = " ORDER BY id DESC";

    if (sort === "cgpa_desc") {
      orderBy = " ORDER BY cgpa DESC";
    } else if (sort === "cgpa_asc") {
      orderBy = " ORDER BY cgpa ASC";
    }

    // 1️⃣ Get total count
    const [countResult] = await connection.query(
      "SELECT COUNT(*) as count " + baseQuery,
      values
    );

    const total = countResult[0].count;
    const totalPages = Math.ceil(total / limit);

    // Prevent invalid page numbers
    if (page > totalPages && totalPages !== 0) {
      return res.redirect(`/?page=${totalPages}`);
    }

    // 2️⃣ Get paginated students
    const [students] = await connection.query(
      "SELECT * " + baseQuery + orderBy + " LIMIT ? OFFSET ?",
      [...values, limit, offset]
    );

    // 3️⃣ Chart Data
    const [chartData] = await connection.query(
      "SELECT branch, COUNT(*) as count " + baseQuery + " GROUP BY branch",
      values
    );

    let cse = 0, ece = 0, mech = 0;

    chartData.forEach(row => {
      if (row.branch === "CSE") cse = row.count;
      if (row.branch === "ECE") ece = row.count;
      if (row.branch === "MECH") mech = row.count;
    });

    res.render('index', {
      students,
      cse,
      ece,
      mech,
      search,
      branch,
      sort,
      total,
      page,
      totalPages,
      csrfToken: req.csrfToken(),
      session: req.session,
      errorMessage: req.query.error || null,
      successMessage: req.query.success || null

    });

  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: "Internal Server Error" });
  }

});

/* =====================
   ADD STUDENT
===================== */
router.post('/add', isAdmin, upload.single('photo'), csrfProtection, async (req, res) => {

  const { name, age, branch, cgpa } = req.body;
  

  const error = validateStudent({ name, age, branch, cgpa });
 if (error) {
  return res.redirect('/?error=' + encodeURIComponent(error));
}


  const photo = req.file ? req.file.filename : null;

  const sql = "INSERT INTO students (name, age, branch, cgpa, photo) VALUES (?, ?, ?, ?, ?)";
 
try {
const [result] = await connection.query(
  sql,
  [name, age, branch, cgpa, photo]
);

await connection.query(
  "INSERT INTO activity_logs (action, student_id) VALUES (?, ?)",
  ["ADD", result.insertId]
);
  res.redirect('/?success=' + encodeURIComponent('Student added successfully'));
} catch (err) {
  console.error(err);
res.redirect('/?error=Insert failed');
}

});

/* =====================
   DELETE STUDENT
===================== */
router.post('/delete/:id', isAdmin, async (req, res) => {

  const id = req.params.id;

  try {
const [result] = await connection.query(
  "DELETE FROM students WHERE id = ?",
  [id]
);

if (result.affectedRows > 0) {
  await connection.query(
    "INSERT INTO activity_logs (action, student_id) VALUES (?, ?)",
    ["DELETE", id]
  );
}
  res.redirect('/?success=' + encodeURIComponent('Student deleted successfully'));
} catch (err) {
  console.error(err);
res.redirect('/?error=Delete failed');

}

});

/* =====================
   EDIT FORM
===================== */
router.get('/edit/:id', isAdmin, csrfProtection, async (req, res) => {

  const id = req.params.id;

  try {
  const [results] = await connection.query(
    "SELECT * FROM students WHERE id = ?",
    [id]
  );

  res.render('edit', {
    student: results[0],
    csrfToken: req.csrfToken()
  });

} catch (err) {
  console.error(err);
  res.send("Error");
}


});

/* =====================
   UPDATE STUDENT
===================== */
router.post('/update/:id', isAdmin, upload.single('photo'), csrfProtection, async (req, res) => {

  const id = req.params.id;
  const { name, age, branch, cgpa } = req.body;

  const error = validateStudent({ name, age, branch, cgpa });
  if (error) {
  return res.redirect('/?error=' + encodeURIComponent(error));
}


  const photo = req.file ? req.file.filename : null;

  let sql;
  let values;

  if (photo) {
    sql = "UPDATE students SET name=?, age=?, branch=?, cgpa=?, photo=? WHERE id=?";
    values = [name, age, branch, cgpa, photo, id];
  } else {
    sql = "UPDATE students SET name=?, age=?, branch=?, cgpa=? WHERE id=?";
    values = [name, age, branch, cgpa, id];
  }

  try {
await connection.query(sql, values);

await connection.query(
  "INSERT INTO activity_logs (action, student_id) VALUES (?, ?)",
  ["UPDATE", id]
);
  res.redirect('/?success=' + encodeURIComponent('Student updated successfully'));
} catch (err) {
  console.error(err);
res.redirect('/?error=Update failed');
}


});

/* =====================
   EXPORT EXCEL
===================== */
router.get('/export', isAdmin, async (req, res) => {

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Students");

  worksheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Name", key: "name", width: 20 },
    { header: "Age", key: "age", width: 10 },
    { header: "Branch", key: "branch", width: 15 },
    { header: "CGPA", key: "cgpa", width: 10 }
  ];
/*
  connection.query("SELECT * FROM students", async (err, results) => {
    if (err) return res.send("Export failed");

    results.forEach(student => {
      worksheet.addRow(student);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=students.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  });
*/
try {
  const [results] = await connection.query("SELECT * FROM students");

  results.forEach(student => {
    worksheet.addRow(student);
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=students.xlsx"
  );

  await workbook.xlsx.write(res);
  res.end();

} catch (err) {
  console.error(err);
  res.send("Export failed");
}

});
router.get('/logs', isAdmin, async (req, res) => {
  try {
    const [logs] = await connection.query(
      "SELECT * FROM activity_logs ORDER BY timestamp DESC"
    );

    res.render('logs', { logs });

  } catch (err) {
    console.error(err);
    res.send("Error loading logs");
  }
});
router.get('/student/:id', isAdmin, async (req, res) => {
  const id = req.params.id;

  try {
    const [results] = await connection.query(
      "SELECT * FROM students WHERE id = ?",
      [id]
    );

    if (results.length === 0) {
      return res.send("Student not found");
    }

    res.render('profile', { student: results[0] });

  } catch (err) {
    console.error(err);
    res.send("Error loading profile");
  }
});
router.get('/student/:id/photo', isAdmin, async (req, res) => {
  const id = req.params.id;

  try {
    const [results] = await connection.query(
      "SELECT photo FROM students WHERE id = ?",
      [id]
    );

    if (results.length === 0) {
      return res.send("Student not found");
    }

    res.render('photo', { photo: results[0].photo });

  } catch (err) {
    console.error(err);
    res.send("Error loading photo");
  }
});

module.exports = router;
 