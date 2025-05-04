const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter configuration
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/vnd.ms-powerpoint", 
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", 
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
    "image/jpeg",
    "image/png",
    "application/zip", 
    "application/x-zip-compressed" 
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Allowed: PDF, PPT, PPTX, XLSX, JPG, PNG, ZIP."), false);
  }
};

// Initialize multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: fileFilter
});

// Create specific middleware functions
const uploadFile = upload.single('file'); 
const uploadFiles = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]); 

module.exports = {
  uploadFile,
  uploadFiles
};