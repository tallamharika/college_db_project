const isAdmin = (req, res, next) => {
  if (!req.session || !req.session.admin) {
    return res.redirect('/login');
  }
  next();
};

module.exports = isAdmin;
