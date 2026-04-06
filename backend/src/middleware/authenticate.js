const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required"
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      if (process.env.NODE_ENV !== 'production') console.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: "Server configuration error"
      });
    }

    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Invalid or expired token"
        });
      }

      req.user = user;
      next();
    });

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error(error);
    return res.status(500).json({
      success: false,
      message: "Token verification failed"
    });
  }
};

module.exports = authenticateToken;
