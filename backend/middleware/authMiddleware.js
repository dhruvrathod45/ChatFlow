const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    let token = req.header("Authorization");

    if (!token) {
      return res.status(401).json({
        message: "No token, authorization denied"
      });
    }

    // Handle Bearer format
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trim();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Store decoded user info on request
    req.user = decoded; // { id, name, email }

    next();
  } catch (error) {
    res.status(401).json({
      message: "Token is not valid or has expired"
    });
  }
};

module.exports = authMiddleware;