const cloudinary = require("../config/cloudinary");
const fs = require("fs").promises;
const User = require("../models/usermodel");
const jwt = require('jsonwebtoken');

const DEFAULT_PROFILE_PIC = 'https://i.pinimg.com/736x/dc/9c/61/dc9c614e3007080a5aff36aebb949474.jpg';

const uploadprofilepic = async (req, res) => {
  try {
    // Verify token from headers
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      if (req.file) await fs.unlink(req.file.path).catch(console.error);
      return res.status(401).json({ message: "Authorization token missing" });
    }

    // Decode token
    const decoded = jwt.verify(token, process.env.JWT);
    if (!decoded) {
      if (req.file) await fs.unlink(req.file.path).catch(console.error);
      return res.status(401).json({ message: "Invalid token" });
    }

    // Find user
    const user = await User.findOne({ username: decoded.username });
    if (!user) {
      if (req.file) await fs.unlink(req.file.path).catch(console.error);
      return res.status(404).json({ message: "User not found" });
    }

    // Handle skip case
    if (req.body.skip) {
      // Delete old profile picture if exists and not default
      if (user.profilepic && user.profilepic !== DEFAULT_PROFILE_PIC && user.profilepic.includes('cloudinary')) {
        const publicId = user.profilepic.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId).catch(console.error);
      }

      // Update user with default picture
      const updatedUser = await User.findOneAndUpdate(
        { username: decoded.username },
        { profilepic: DEFAULT_PROFILE_PIC },
        { new: true, select: '-password' }
      ).lean();

      return res.status(200).json({
        message: "Default profile picture set successfully",
        user: updatedUser,
        url: DEFAULT_PROFILE_PIC
      });
    }

    // Handle file upload case
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "profile_pictures",
      width: 500,
      height: 500,
      crop: "fill",
      quality: "auto:best"
    });

    // Delete temp file
    await fs.unlink(req.file.path).catch(console.error);

    // Delete old profile picture if exists and not default
    if (user.profilepic && user.profilepic !== DEFAULT_PROFILE_PIC && user.profilepic.includes('cloudinary')) {
      const publicId = user.profilepic.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId).catch(console.error);
    }

    // Update user
    const updatedUser = await User.findOneAndUpdate(
      { username: decoded.username },
      { profilepic: result.secure_url },
      { new: true, select: '-password' }
    ).lean();

    res.status(200).json({
      message: "Profile picture updated successfully!",
      user: updatedUser,
      url: result.secure_url
    });

  } catch (error) {
    console.error("Error:", error);
    if (req.file) await fs.unlink(req.file.path).catch(console.error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    }
    
    res.status(500).json({
      message: "Failed to update profile picture",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { uploadprofilepic };