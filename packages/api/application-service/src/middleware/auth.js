const authMiddleware = (req, res, next) => {
  req.user = { id: 1 }; // Dummy user for testing
  next();
};

module.exports = authMiddleware;
