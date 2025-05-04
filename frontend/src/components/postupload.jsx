import React, { useState, useRef } from "react";
import axios from "axios";
import { FiUpload, FiImage, FiX, FiFile, FiType } from "react-icons/fi";

const PostUpload = () => {
  const [heading, setHeading] = useState("");
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [contentType, setContentType] = useState("file"); 
  const [textContent, setTextContent] = useState("");
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleThumbnailChange = (e) => {
    const selectedThumbnail = e.target.files[0];
    if (selectedThumbnail) {
      setThumbnail(selectedThumbnail);
      const reader = new FileReader();
      reader.onload = () => setThumbnailPreview(reader.result);
      reader.readAsDataURL(selectedThumbnail);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  const removeThumbnail = () => {
    setThumbnail(null);
    setThumbnailPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadStatus("");
  
    if (!heading) {
      setUploadStatus("Please provide a heading.");
      setIsUploading(false);
      return;
    }

    if (contentType === "file" && !file) {
      setUploadStatus("Please provide a file.");
      setIsUploading(false);
      return;
    }

    if (contentType === "text" && !textContent.trim()) {
      setUploadStatus("Please provide text content.");
      setIsUploading(false);
      return;
    }
  
    const token = localStorage.getItem('edunotoken');
    const formData = new FormData();
    formData.append("heading", heading);
    formData.append("contentType", contentType);
    
    if (contentType === "file") {
      formData.append("file", file);
      if (thumbnail) formData.append("thumbnail", thumbnail);
    } else {
      formData.append("textContent", textContent);
      if (thumbnail) formData.append("thumbnail", thumbnail);
    }
    
    formData.append("token", token);
  
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API}/api/postupload`, 
        formData, 
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: contentType === "file" ? (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadStatus(`Uploading: ${percentCompleted}%`);
          } : undefined,
        }
      );
  
      setUploadStatus(`✅ Upload successful!`);
      setHeading("");
      setFile(null);
      setThumbnail(null);
      setPreview(null);
      setThumbnailPreview(null);
      setTextContent("");
    } catch (err) {
      console.error("Upload error:", err);
      let errorMessage = "❌ Upload failed. Please try again.";
      
      if (err.response) {
        if (err.response.data && err.response.data.error) {
          errorMessage = `❌ ${err.response.data.error}`;
        } else if (err.response.status === 413) {
          errorMessage = "❌ File too large (max 5MB)";
        }
      }
      
      setUploadStatus(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <FiImage className="text-blue-500" />;
    if (['pdf'].includes(ext)) return <FiFile className="text-red-500" />;
    if (['ppt', 'pptx'].includes(ext)) return <FiFile className="text-orange-500" />;
    if (['xlsx', 'csv'].includes(ext)) return <FiFile className="text-green-500" />;
    return <FiFile className="text-gray-500" />;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Post</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Heading */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter a descriptive title"
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
   
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Type <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setContentType("file")}
              className={`px-4 py-2 rounded-lg border ${
                contentType === "file"
                  ? "bg-blue-100 border-blue-500 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center">
                <FiFile className="mr-2" />
                File Upload
              </div>
            </button>
            <button
              type="button"
              onClick={() => setContentType("text")}
              className={`px-4 py-2 rounded-lg border ${
                contentType === "text"
                  ? "bg-blue-100 border-blue-500 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center">
                <FiType className="mr-2" />
                Text Content
              </div>
            </button>
          </div>
        </div>
        
       
        {contentType === "file" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main File <span className="text-red-500">*</span>
            </label>
            {!file ? (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => fileInputRef.current.click()}
              >
                <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">PDF, PPT, Excel,ZIP or Image (Max 100MB)</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.ppt,.pptx,.xlsx,.jpg,.jpeg,.png,.zip"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {preview ? (
                    <img src={preview} alt="Preview" className="h-12 w-12 object-cover rounded" />
                  ) : (
                    <div className="h-12 w-12 flex items-center justify-center bg-gray-100 rounded">
                      {getFileIcon(file.name)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-gray-500 hover:text-red-500"
                >
                  <FiX size={20} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Content <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Enter your post content here..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-40"
              required
            />
          </div>
        )}
        
        {/* Thumbnail Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Thumbnail (Optional)
          </label>
          {!thumbnailPreview ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => thumbnailInputRef.current.click()}
            >
              <FiImage className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">Upload a custom thumbnail image</p>
              <p className="text-xs text-gray-500">JPG or PNG (Recommended: 1200×630)</p>
              <input
                type="file"
                ref={thumbnailInputRef}
                onChange={handleThumbnailChange}
                accept=".jpg,.jpeg,.png"
                className="hidden"
              />
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img src={thumbnailPreview} alt="Thumbnail preview" className="h-12 w-12 object-cover rounded" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Custom thumbnail</p>
                  <p className="text-xs text-gray-500">{(thumbnail.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeThumbnail}
                className="text-gray-500 hover:text-red-500"
              >
                <FiX size={20} />
              </button>
            </div>
          )}
        </div>
        
        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isUploading}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center ${
              isUploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            } transition-colors`}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <FiUpload className="mr-2" />
                Publish Post
              </>
            )}
          </button>
        </div>
        
        {/* Status Message */}
        {uploadStatus && (
          <div className={`p-3 rounded-lg ${
            uploadStatus.includes("✅") 
              ? "bg-green-50 text-green-700" 
              : uploadStatus.includes("❌") 
                ? "bg-red-50 text-red-700" 
                : "bg-blue-50 text-blue-700"
          }`}>
            <p className="text-sm font-medium">{uploadStatus}</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default PostUpload;