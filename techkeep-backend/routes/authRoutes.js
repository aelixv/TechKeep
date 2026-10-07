const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

const { userCollection } = require("../models/User");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// REGISTER
// =====================================================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email, and password are required",
      });
    }

    const users = userCollection(
      req.app.locals.db
    );

    const existingUser = await users.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email is already registered",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: "buyer",
      phone: "",
      address: "",
      createdAt: new Date(),
    };

    const result =
      await users.insertOne(newUser);

    res.status(201).json({
      message:
        "Account created successfully!",
      userId: result.insertedId,
    });

  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    res.status(500).json({
      message: "Registration failed",
    });
  }
});

// =====================================================
// LOGIN
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const users = userCollection(
      req.app.locals.db
    );

    const user = await users.findOne({
      email,
    });

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Login successful!",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        role: user.role,
      },
    });

  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      message: "Login failed",
    });
  }
});

// =====================================================
// GET CURRENT USER
// =====================================================

router.get(
  "/me",
  authenticateToken,
  async (req, res) => {
    try {
      res.json({
        message:
          "User retrieved successfully!",
        user: req.user,
      });

    } catch (error) {
      console.error(
        "Get current user error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to get user",
      });
    }
  }
);

// =====================================================
// UPDATE CURRENT USER
// =====================================================

router.put(
  "/me",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        address,
      } = req.body;

      const users = userCollection(
        req.app.locals.db
      );

      // ================================================
      // USE THE ID FROM AUTH MIDDLEWARE
      // ================================================

      const userId = new ObjectId(
        req.user._id
      );

      // ================================================
      // CHECK EMAIL
      // ================================================

      if (email !== undefined) {
        const existingUser =
          await users.findOne({
            email: email,
            _id: {
              $ne: userId,
            },
          });

        if (existingUser) {
          return res.status(400).json({
            message:
              "Email is already registered to another account",
          });
        }
      }

      // ================================================
      // BUILD UPDATE
      // ================================================

      const updateFields = {};

      if (name !== undefined) {
        updateFields.name = name.trim();
      }

      if (email !== undefined) {
        updateFields.email =
          email.trim().toLowerCase();
      }

      if (phone !== undefined) {
        updateFields.phone =
          phone.trim();
      }

      if (address !== undefined) {
        updateFields.address =
          address.trim();
      }

      // ================================================
      // CHECK IF THERE IS SOMETHING TO UPDATE
      // ================================================

      if (
        Object.keys(updateFields).length === 0
      ) {
        return res.status(400).json({
          message:
            "No information to update",
        });
      }

      // ================================================
      // UPDATE MONGODB
      // ================================================

      const result =
        await users.updateOne(
          {
            _id: userId,
          },
          {
            $set: updateFields,
          }
        );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // ================================================
      // GET UPDATED USER
      // ================================================

      const updatedUser =
        await users.findOne({
          _id: userId,
        });

      const {
        password,
        ...safeUser
      } = updatedUser;

      res.json({
        message:
          "Profile updated successfully!",
        user: safeUser,
      });

    } catch (error) {
      console.error(
        "Update user error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update profile",
      });
    }
  }
);

router.put("/reset-password", async (req, res) => {
  try {
    const {
      email,
      newPassword,
    } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        message:
          "Email and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    const users = userCollection(
      req.app.locals.db
    );

    const user = await users.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        message:
          "No account was found with this email",
      });
    }

    const hashedPassword =
      await bcrypt.hash(newPassword, 10);

    await users.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          password: hashedPassword,
        },
      }
    );

    res.json({
      message:
        "Password reset successfully!",
    });

  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to reset password",
    });
  }
});


module.exports = router;

