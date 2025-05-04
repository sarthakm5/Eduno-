const jwt = require("jsonwebtoken");
const usermodel = require("../models/usermodel");
const bcrypt = require("bcrypt");

const register = async (req, res) => {
  const { username, password, fullname } = req.body;
  try {
    // Validate required fields
    if (!username || !password || !fullname) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    // Normalize username to lowercase for case-insensitive check
    const normalizedUsername = username.toLowerCase();

    // Check if user exists (case-insensitive)
    const userExists = await usermodel.findOne({ username: { $regex: `^${normalizedUsername}$`, $options: 'i' } });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedpass = await bcrypt.hash(password, salt);

    // Create user
    const User = await usermodel.create({
      username: normalizedUsername, // Store username in lowercase
      fullname,
      password: hashedpass,
    });

    // Generate JWT
    const payload = {
      userId: User._id.toString(),
      username: User.username,
    };
    const token = jwt.sign(payload, process.env.JWT, { expiresIn: '2d' });

    // Send response
    res.status(201).json({
      message: "User created successfully",
      usertoken: token,
      user: {
        id: User._id,
        username: User.username,
        fullname: User.fullname,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      // MongoDB duplicate key error
      return res.status(400).json({ message: "User already exists" });
    }
    res.status(500).json({
      message: "Failed to create user",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = register;