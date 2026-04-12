const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const csrf = require('csurf');
const connection = require('../config/db');
const rateLimit = require('express-rate-limit');
const csrfProtection = csrf();
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Try again in 10 minutes."
});

router.get('/login', csrfProtection, (req, res) => {
  if (req.session.admin) {
    return res.redirect('/');
  }
  res.render('login', { csrfToken: req.csrfToken() });
});
/*
router.post('/login', csrfProtection, async (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM admins WHERE username = ?";

  connection.execute(sql, [username], async (err, results) => {
    if (err) return res.send("Error");

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
*/
router.post('/login', loginLimiter, csrfProtection, async (req, res) => {
  try {
    const { username, password } = req.body;

    const sql = "SELECT * FROM admins WHERE username = ?";

    const [results] = await connection.execute(sql, [username]);

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

  } catch (err) {
    console.error(err);
    res.status(500).send("Login failed");
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
