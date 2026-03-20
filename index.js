require('dotenv').config();
const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const ExcelJS = require('exceljs');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 3000;
app.use(session({
 secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));
function isAdmin(req, res, next) {
  if (!req.session.admin) {
    return res.redirect('/login');
  }
  next();
}

app.use(express.urlencoded({ extended: true }));
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static('uploads'));

// MySQL connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect(err => {
  if (err) throw err;
  console.log("✅ MySQL Connected");
});

// set template engine
app.set('view engine', 'ejs');
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

 const sql = "SELECT * FROM admins WHERE username = ?";

connection.query(sql, [username], async (err, results) => {
  if (err) throw err;

  if (results.length === 0) {
    return res.send("Invalid Credentials");
  }

  const admin = results[0];

  const match = await bcrypt.compare(password, admin.password);

  if (!match) {
    return res.send("Invalid Credentials");
  }

  req.session.admin = true;
  res.redirect('/');
});

});
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// route
app.get('/', isAdmin, (req, res) => {
if (!req.session.admin) {
  return res.redirect('/login');
}

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
}

if (sort === 'cgpa_asc') {
  sql += " ORDER BY cgpa ASC";
}
if (!sort) {
  sql += " ORDER BY id DESC";
}

  sql += " LIMIT ? OFFSET ?";
  values.push(limit, offset);

  // 1️⃣ Get students for current page
  connection.query(sql, values, (err, students) => {
    if (err) throw err;

    // 2️⃣ Get total student count
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

        if (err) throw err;

        const total = countResult[0].count;
        const totalPages = Math.ceil(total / limit);

        // 3️⃣ Get branch data for graph
       
     // 3️⃣ Get branch data for graph (FILTERED)

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

  if (err) throw err;

  let cse = 0, ece = 0, mech = 0;

  chartData.forEach(row => {
    if (row.branch === 'CSE') cse = row.count;
    if (row.branch === 'ECE') ece = row.count;
    if (row.branch === 'MECH') mech = row.count;
  });

  res.render('index', {
  session: req.session,
    students,
    search,
    branch,
    sort,
    total,
    cse,
    ece,
    mech,
    page,
    totalPages
  });

});

      }
    );
  });
});

app.post('/add', isAdmin, upload.single('photo'),(req, res) => {

const { name, age, branch, cgpa } = req.body;
const photo = req.file ? req.file.filename : null;
if (!name || !age || !branch || !cgpa) {
  return res.send("All fields are required.");
}

if (cgpa < 0 || cgpa > 10) {
  return res.send("CGPA must be between 0 and 10.");
}

const sql = "INSERT INTO students (name, age, branch, cgpa, photo) VALUES (?, ?, ?, ?, ?)";

connection.query(sql, [name, age, branch, cgpa, photo], (err) => {
if (err) throw err;

res.redirect('/');
});

});

app.get('/delete/:id', isAdmin, (req, res) => {

  const id = req.params.id;

  const sql = "DELETE FROM students WHERE id = ?";

  connection.query(sql, [id], (err) => {
    if (err) throw err;

    res.redirect('/');
  });

});
// show edit form
app.get('/edit/:id', isAdmin, (req, res) => {

  const id = req.params.id;

  const sql = "SELECT * FROM students WHERE id = ?";

  connection.query(sql, [id], (err, results) => {
    if (err) throw err;

    res.render('edit', { student: results[0] });
  });

});
app.get('/student/:id', (req, res) => {

  const id = req.params.id;

  const sql = "SELECT * FROM students WHERE id = ?";

  connection.query(sql, [id], (err, results) => {
    if (err) throw err;

    res.render('profile', { student: results[0] });
  });

});

// update student
app.post('/update/:id', isAdmin, upload.single('photo'), (req, res) => {

  const id = req.params.id;

  const name = req.body.name;
  const age = req.body.age;
  const branch = req.body.branch;
  const cgpa = req.body.cgpa;

  const photo = req.file ? req.file.filename : null;

  let sql;
  let values;

  if(photo){
    sql = "UPDATE students SET name=?, age=?, branch=?, cgpa=?, photo=? WHERE id=?";
    values = [name, age, branch, cgpa, photo, id];
  } else {
    sql = "UPDATE students SET name=?, age=?, branch=?, cgpa=? WHERE id=?";
    values = [name, age, branch, cgpa, id];
  }

  connection.query(sql, values, (err) => {
    if (err) throw err;
    res.redirect('/');
  });

});

app.get("/export", isAdmin, async (req, res) => {

const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet("Students");

worksheet.columns = [
{ header: "ID", key: "id", width: 10 },
{ header: "Name", key: "name", width: 20 },
{ header: "Age", key: "age", width: 10 },
{ header: "Branch", key: "branch", width: 15 },
{ header: "CGPA", key: "cgpa", width: 10 }
];

connection.query("SELECT * FROM students", async (err, results) => {

if (err) throw err;

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

});


app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
