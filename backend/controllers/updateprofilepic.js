const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const User = require("../models/usermodel");
const jwt = require('jsonwebtoken');

const updateprofilepic = async (req, res) => {
  try {
    // 1. Check if file exists
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "No file uploaded" 
      });
    }

    // 2. Get token from either body or headers
    const token = req.body.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      fs.unlinkSync(req.file.path);
      return res.status(401).json({ 
        success: false,
        message: "Authorization token missing" 
      });
    }

    // 3. Decode token
    const decoded = jwt.verify(token, process.env.JWT);
    if (!decoded) {
      fs.unlinkSync(req.file.path);
      return res.status(401).json({ 
        success: false,
        message: "Invalid token" 
      });
    }

    // 4. Find user
    const user = await User.findOne({ username: decoded.username });
    if (!user) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // 5. Upload new image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "profile_pictures",
      width: 500,
      height: 500,
      crop: "fill",
      quality: "auto:best"
    });

    // 6. Delete temp file
    fs.unlinkSync(req.file.path);

    // 7. Delete old profile picture if exists
    if (user.profilepic && user.profilepic.includes('cloudinary')) {
      const publicId = user.profilepic.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId).catch(err => {
        console.error("Error deleting old image:", err);
      });
    }

    // 8. Update user in database
    const updatedUser = await User.findOneAndUpdate(
      { username: decoded.username },
      { profilepic: result.secure_url },
      { new: true, select: '-password' }
    ).lean();

    // 9. Return success response
    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      user: updatedUser,
      imageUrl: result.secure_url
    });

  } catch (error) {
    console.error("Profile pic update error:", error);
    
    // Clean up temp file if exists
    if (req.file?.path) {
      fs.unlinkSync(req.file.path).catch(console.error);
    }

    // Handle specific errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token" 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Token expired" 
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update profile picture",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = updateprofilepic;