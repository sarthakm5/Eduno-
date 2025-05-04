import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';

const AddDOB = () => {
  const navigate = useNavigate();
  const [dob, setDob] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const token = localStorage.getItem('edunotoken');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dob) {
      toast.error('Please select a date of birth');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_API}/api/addob`, {
        token,
        dob,
      });

      if (response.data.user) {
        toast.success('DOB updated successfully');
        navigate(`/home`);
      }
    } catch (error) {
      console.error('Error updating DOB:', error);
      toast.error(error.response?.data?.message || 'Failed to update DOB');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6">
      <Toaster position="top-center" />
      <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 max-w-md w-full hover:shadow-lg transition-shadow duration-300">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">Update Date of Birth</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              placeholder="Select your date of birth"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors duration-200 ${
              isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } transform hover:scale-105`}
          >
            {isLoading ? 'Updating...' : 'Update DOB'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDOB;