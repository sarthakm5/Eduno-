const fs = require("fs");
const path = require("path");
const Post = require("../models/postmodel");
const jwt = require("jsonwebtoken");
const User = require("../models/usermodel");
const imagekit = require("../config/imagekit");
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);

// Helper function to safely delete files
const safeUnlink = async (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      await unlinkAsync(filePath);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') { // Ignore "file not found" errors
      console.error(`Error deleting file ${filePath}:`, err);
    }
  }
};

const uploadDocument = async (req, res) => {
  // Track files to clean up
  const filesToCleanup = [];

  try {
    const token = req.body.token;
    const heading = req.body.heading || "";
    const contentType = req.body.contentType || "file";
    const textContent = req.body.textContent || "";

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT);
    const user = await User.findOne({ username: decoded.username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add files to cleanup list if they exist
    if (req.files?.file) filesToCleanup.push(req.files.file[0].path);
    if (req.files?.thumbnail) filesToCleanup.push(req.files.thumbnail[0].path);

    let fileUrl = "";
    let downloadUrl = "";
    let thumbnailUrl = "";
    let fileType = "";
    let fileName = "";

    if (contentType === "file") {
      if (!req.files || !req.files.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const mainFile = req.files.file[0];
      const fileExtension = path.extname(mainFile.originalname).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png'].includes(fileExtension);
      const isZip = fileExtension === '.zip';

      // Upload main file to ImageKit
      const uploadResult = await imagekit.upload({
        file: fs.createReadStream(mainFile.path),
        fileName: mainFile.originalname,
        folder: "/documents",
        useUniqueFileName: true,
      });

      fileUrl = uploadResult.url;
      fileType = fileExtension.replace('.', '');
      fileName = mainFile.originalname;
      downloadUrl = fileUrl;

      if (!isZip) {
        downloadUrl = imagekit.url({
          path: uploadResult.filePath,
          transformation: [{
            format: 'jpg',
            quality: 100
          }]
        });
      }

      // Process thumbnail
      if (req.files.thumbnail) {
        const thumbnailUpload = await imagekit.upload({
          file: fs.createReadStream(req.files.thumbnail[0].path),
          fileName: req.files.thumbnail[0].originalname,
          folder: "/thumbnails",
          useUniqueFileName: true,
        });
        thumbnailUrl = thumbnailUpload.url;
      } else if (isImage) {
        thumbnailUrl = uploadResult.url;
      } else {
        const thumbnailResult = await imagekit.url({
          path: uploadResult.filePath,
          transformation: [{
            height: 300,
            width: 300,
            crop: 'fit',
            format: 'jpg',
            quality: 80,
            overlayText: isZip ? 'ZIP Archive' : fileType.toUpperCase(),
            overlayTextFontSize: 40,
            overlayTextColor: 'ffffff',
            overlayBackground: '00000080'
          }]
        });
        thumbnailUrl = thumbnailResult;
      }
    } else {
      if (!textContent.trim()) {
        return res.status(400).json({ message: "Text content is required" });
      }

      const words = textContent.split(/\s+/).slice(0, 10).join(' ');
      thumbnailUrl = req.files?.thumbnail ? 
        (await imagekit.upload({
          file: fs.createReadStream(req.files.thumbnail[0].path),
          fileName: req.files.thumbnail[0].originalname,
          folder: "/thumbnails",
          useUniqueFileName: true,
        })).url : 
        imagekit.url({
          path: "/defaults/text-thumbnail.jpg",
          transformation: [{
            height: 300,
            width: 300,
            overlayText: words,
            overlayTextFontSize: 24,
            overlayTextColor: 'ffffff',
            overlayBackground: '00000080',
            overlayTextPadding: 20
          }]
        });

      fileType = "text";
      fileName = "text-content.txt";
    }

    // Save to DB
    const newPost = new Post({
      heading,
      content: contentType === "text" ? textContent : null,
      fileUrl: contentType === "file" ? fileUrl : null,
      downloadUrl: contentType === "file" ? downloadUrl : null,
      thumbnail: thumbnailUrl,
      fileType,
      fileName,
      contentType,
      user: user._id,
    });
    
    await newPost.save();
    user.post.push(newPost._id);
    await user.save();

    // Clean up files only after successful upload
    await Promise.all(filesToCleanup.map(safeUnlink));

    return res.status(200).json({
      success: true,
      message: "Post uploaded and saved successfully",
      post: newPost
    });
  } catch (err) {
    console.error("Upload error:", err);
    
    // Attempt to clean up any remaining files
    await Promise.all(filesToCleanup.map(safeUnlink));
    
    return res.status(500).json({ 
      success: false,
      message: "Something went wrong", 
      error: err.message 
    });
  }
};

module.exports = { uploadDocument };