import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';

const ProfilePictureUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('edunotoken');

  useEffect(() => {
    if (!token) {
      navigate('/signup');
    }
  }, [navigate, token]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
   
      if (!file.type.match('image.*')) {
        toast.error('Please select an image file');
        return;
      }
   
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
  if (!selectedFile) {
    toast.error('Please select a file first');
    return;
  }

  setLoading(true);

  try {
    const formData = new FormData();
    formData.append('profile', selectedFile);
    
    const response = await axios.post(
      `${import.meta.env.VITE_API}/api/profileupload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    if (response.data.message.includes('successfully')) {
      toast.success(response.data.message);
      setTimeout(() => {
        navigate('/addob');
      }, 1500);
    } else {
      throw new Error(response.data.message || 'Failed to upload profile picture');
    }
  } catch (error) {
    console.error('Upload error:', error);
    
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timed out. Please try again.');
    } else if (error.response) {
      // Server responded with a status code outside 2xx
      const errorMessage = error.response.data?.message || 
                          error.response.statusText || 
                          'Failed to upload profile picture';
      toast.error(errorMessage);
      
      if (error.response.status === 401) {
        localStorage.removeItem('edunotoken');
        navigate('/signup');
      }
    } else if (error.request) {
      // Request was made but no response received
      toast.error('Network error. Please check your connection and try again.');
    } else {
      // Something happened in setting up the request
      toast.error('An unexpected error occurred. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};

  const handleSkip = async () => {
    setLoading(true);
  
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API}/api/profileupload`,
        { skip: true },  // Changed from { skip: 'true' } to boolean
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (response.data.message === 'Default profile picture set successfully') {
        toast.success('Default profile picture set!');
        setTimeout(() => {
          navigate('/addob');
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to set default profile picture');
      }
    } catch (error) {
      console.error('Skip error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to set default profile picture';
      toast.error(errorMessage);
      if (error.response?.status === 401) {
        localStorage.removeItem('edunotoken');
        navigate('/signup');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-md bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">Add Profile Picture</h1>
        
        <div className="flex flex-col items-center mb-6">
          {previewUrl ? (
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-blue-500">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
              <svg 
                className="w-12 h-12 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Choose a profile picture
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleUpload}
            disabled={loading || !selectedFile}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              loading || !selectedFile ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Processing...' : 'Upload Picture'}
          </button>

          <button
            onClick={handleSkip}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 ${
              loading ? 'cursor-not-allowed opacity-70' : ''
            }`}
          >
            {loading ? 'Processing...' : 'Skip for now'}
          </button>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          You can always update your profile picture later in settings.
        </div>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
