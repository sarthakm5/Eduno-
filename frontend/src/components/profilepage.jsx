import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { FaHeart, FaRegHeart, FaShare, FaEdit, FaCamera, FaTimes, FaSignOutAlt, FaSearch, FaArrowLeft } from 'react-icons/fa';

const ProfilePage = () => {
  const { userid } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState({ isFollowing: false });
  const [token] = useState(localStorage.getItem('edunotoken'));
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpdatingProfilePic, setIsUpdatingProfilePic] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editFormData, setEditFormData] = useState({ fullname: '', bio: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await axios.post(`${import.meta.env.VITE_API}/api/profilepage`, { userid, token });
        
        if (response.data.body?.user) {
          setProfileData(response.data.body.user);
          setPosts(response.data.body.user.post || []);
          setFollowStatus({ isFollowing: response.data.body.isFollowing || false });
          setIsOwnProfile(response.data.body.isOwnProfile || false);
          setEditFormData({
            fullname: response.data.body.user.fullname || '',
            bio: response.data.body.user.bio || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast.error('Failed to load profile');
        if (error.response?.status === 401) {
          localStorage.removeItem('edunotoken');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userid, token, navigate]);

  const handleProfilePicUpdate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('token', token);

    try {
      setIsUpdatingProfilePic(true);
      const response = await axios.post(`${import.meta.env.VITE_API}/api/updateprofilepic`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.user) {
        setProfileData(response.data.user);
        toast.success('Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile picture');
    } finally {
      setIsUpdatingProfilePic(false);
      e.target.value = '';
    }
  };

  const handleFollow = async () => {
    if (!token) {
      toast.error('Please login to follow');
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API}/api/userfollow`, { token, userid });
      if (response.data.success) {
        setFollowStatus({ isFollowing: response.data.isFollowing });
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(`${window.location.origin}/profile/${userid}`)
      .then(() => toast.success('Profile link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'));
  };

  const handleEditProfile = () => setShowEditProfile(true);

  const handleEditFormChange = (e) => {
    setEditFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileUpdate = async () => {
    if (!token) {
      toast.error('Please login to update profile');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API}/api/updateprofile`, {
        fullname: editFormData.fullname,
        bio: editFormData.bio,
        token
      });

      if (response.data.user) {
        setProfileData(prev => ({
          ...prev,
          fullname: editFormData.fullname,
          bio: editFormData.bio
        }));
        toast.success('Profile updated successfully');
        setShowEditProfile(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('edunotoken');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const filteredFollowers = (profileData?.followers || []).filter(user => 
    user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFollowing = (profileData?.following || []).filter(user => 
    user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-600 text-lg font-medium">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      
      {showEditProfile && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                <button onClick={() => setShowEditProfile(false)} className="text-gray-500 hover:text-gray-700">
                  <FaTimes className="text-xl" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullname"
                    value={editFormData.fullname}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={editFormData.bio}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about yourself"
                    rows="4"
                  />
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={isUpdatingProfile}
                    className={`w-full py-3 px-4 rounded-lg text-white font-medium ${isUpdatingProfile ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {isUpdatingProfile ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Confirm Logout</h2>
                <button onClick={() => setShowLogoutConfirm(false)} className="text-gray-500 hover:text-gray-700">
                  <FaTimes className="text-xl" />
                </button>
              </div>
              <p className="text-gray-600 text-base mb-6">Are you sure you want to log out?</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showFollowers || showFollowing) && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col shadow-xl">
            <div className="p-4 border-b border-gray-200 flex items-center">
              <button
                onClick={() => { setShowFollowers(false); setShowFollowing(false); setSearchQuery(''); }}
                className="p-2 rounded-full hover:bg-gray-100 mr-2"
              >
                <FaArrowLeft />
              </button>
              <h2 className="text-xl font-bold flex-1 text-center">
                {showFollowers ? 'Followers' : 'Following'}
              </h2>
            </div>
            
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {(showFollowers ? filteredFollowers : filteredFollowing).length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {(showFollowers ? filteredFollowers : filteredFollowing).map((user) => (
                    <div
                      key={user.username}
                      className="p-4 flex items-center hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/profile/${user.userId}`)}
                    >
                      <img
                        src={user.profilepic || '/default-avatar.png'}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
                      />
                      <div className="ml-4 flex-1">
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <p className="text-gray-500 text-sm">@{user.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-700">
                    No {showFollowers ? 'followers' : 'following'} found
                  </h3>
                  <p className="text-gray-500 mt-1">
                    {searchQuery ? 'Try a different search' : `This user has no ${showFollowers ? 'followers' : 'following'} yet`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-8 hover:shadow-lg transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-shrink-0 relative">
              <img
                src={profileData.profilepic}
                alt="Profile"
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-md"
                onError={(e) => { e.target.onerror = null; }}
              />
              {isOwnProfile && (
                <>
                  <label
                    htmlFor="profile-pic-upload"
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-md"
                  >
                    <FaCamera className="text-sm" />
                  </label>
                  <input
                    id="profile-pic-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicUpdate}
                    className="hidden"
                    disabled={isUpdatingProfilePic}
                  />
                </>
              )}
              {isUpdatingProfilePic && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-3 border-b-3 border-white"></div>
                </div>
              )}
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profileData.fullname || `@${profileData.username}`}</h1>
                  <p className="text-gray-600 text-base sm:text-lg leading-relaxed">@{profileData.username}</p>
                  {profileData.bio && <p className="text-gray-600 mt-2 text-base leading-relaxed max-w-md">{profileData.bio}</p>}
                </div>
                <div className="flex flex-wrap gap-3">
                  {isOwnProfile ? (
                    <>
                      <button
                        onClick={handleEditProfile}
                        className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-gray-100 hover:bg-gray-200"
                      >
                        <FaEdit /> Edit Profile
                      </button>
                      <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-red-100 text-red-600 hover:bg-red-200"
                      >
                        <FaSignOutAlt /> Logout
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleFollow}
                      disabled={isProcessing}
                      className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium text-sm ${followStatus.isFollowing ? 'bg-white text-black border border-gray-300 hover:bg-gray-100' : 'bg-blue-600 text-white hover:bg-blue-700'} ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {followStatus.isFollowing ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                      {followStatus.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                  <button
                    onClick={handleShareProfile}
                    className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-gray-100 hover:bg-gray-200"
                  >
                    <FaShare /> Share
                  </button>
                </div>
              </div>
              <div className="flex gap-6 sm:gap-12 mt-6">
                <div className="text-center">
                  <p className="font-bold text-lg sm:text-xl">{posts.length}</p>
                  <p className="text-gray-500 text-sm">Posts</p>
                </div>
                <div
                  className="text-center cursor-pointer hover:text-blue-600"
                  onClick={() => setShowFollowers(true)}
                >
                  <p className="font-bold text-lg sm:text-xl">{profileData.followers?.length || 0}</p>
                  <p className="text-gray-500 text-sm">Followers</p>
                </div>
                <div
                  className="text-center cursor-pointer hover:text-blue-600"
                  onClick={() => setShowFollowing(true)}
                >
                  <p className="font-bold text-lg sm:text-xl">{profileData.following?.length || 0}</p>
                  <p className="text-gray-500 text-sm">Following</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
            {isOwnProfile ? 'Your Posts' : 'Posts'}
          </h2>
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/show-post/${post._id}`)}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                      <img
                        src={profileData.profilepic || '/default-avatar.png'}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-900 text-lg">{post.heading || 'Untitled Post'}</h3>
                          <span className="text-xs text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-2 text-base line-clamp-2">{post.content}</p>
                        {post.fileUrl && (
                          <div className="mt-3 text-sm text-blue-600 flex items-center gap-1">
                            <span>📎 Attachment</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <div className="mx-auto w-28 h-28 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-700">
                {isOwnProfile ? 'You have no posts yet' : 'No posts yet'}
              </h3>
              {isOwnProfile ? (
                <button
                  onClick={() => navigate('/create-post')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create your first post
                </button>
              ) : (
                <p className="text-gray-500 mt-2 text-base">No posts yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
