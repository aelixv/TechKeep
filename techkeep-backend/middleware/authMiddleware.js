const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const { userCollection } = require("../models/User");

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  const token =
    authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Access token required",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const users = userCollection(
      req.app.locals.db
    );

    const user = await users.findOne({
      _id: new ObjectId(decoded.userId),
    });

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    const { password, ...safeUser } = user;

    req.user = {
        ...safeUser,
        userId: user._id.toString(),
        };

    next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    return res.status(403).json({
      message: "Invalid or expired token",
    });
  }
}

module.exports = authenticateToken;
