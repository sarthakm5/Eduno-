import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { FaHeart, FaRegHeart, FaShare, FaEdit, FaCamera, FaTimes, FaSignOutAlt } from 'react-icons/fa';

const ProfilePage = () => {
  const { userid } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState({
    isFollowing: false,
    isPending: false,
  });
  const [token] = useState(localStorage.getItem('edunotoken'));
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpdatingProfilePic, setIsUpdatingProfilePic] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullname: '',
    bio: '',
    dob: '',
    gender: '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await axios.post(`${import.meta.env.VITE_API}/api/profilepage`, {
          userid,
          token,
        });

        const { body, isOwnProfile, isFollowing, isPending } = response.data;

        if (body) {
          setProfileData(body.user);
          setPosts(body.user.post || []);
          setFollowStatus({
            isFollowing: isFollowing || false,
            isPending: isPending || false,
          });
          setIsOwnProfile(isOwnProfile);

          setEditFormData({
            fullname: body.user.fullname || '',
            bio: body.user.bio || '',
            dob: body.user.dob ? new Date(body.user.dob).toISOString().split('T')[0] : '',
            gender: body.user.gender || '',
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

    if (!file.type.match('image.*')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('token', token);

    try {
      setIsUpdatingProfilePic(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API}/api/updateprofilepic`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

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

    if (isProcessing) return;
    setIsProcessing(true);

    const prevFollowStatus = { ...followStatus };
    const prevFollowers = profileData.followers || [];

    try {
      const newFollowStatus = { ...followStatus };
      let newFollowers = [...prevFollowers];

      if (followStatus.isFollowing) {
        newFollowStatus.isFollowing = false;
        newFollowers = prevFollowers.filter((id) => id.toString() !== userid);
      } else if (profileData.isPrivate && !followStatus.isPending) {
        newFollowStatus.isPending = true;
      } else {
        newFollowStatus.isFollowing = true;
        newFollowStatus.isPending = false;
        newFollowers = [...prevFollowers, userid];
      }

      setFollowStatus(newFollowStatus);
      setProfileData((prev) => ({ ...prev, followers: newFollowers }));

      const response = await axios.post(`${import.meta.env.VITE_API}/api/userfollow`, {
        token,
        userid,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Operation failed');
      }

      setFollowStatus({
        isFollowing: response.data.isFollowing,
        isPending: response.data.isPending,
      });

      if (
        response.data.isFollowing !== newFollowStatus.isFollowing ||
        response.data.isPending !== newFollowStatus.isPending
      ) {
        setProfileData((prev) => ({
          ...prev,
          followers: response.data.isFollowing
            ? [...new Set([...prev.followers, userid])]
            : prev.followers.filter((id) => id.toString() !== userid),
        }));
      }

      toast.success(response.data.message);
    } catch (error) {
      console.error('Error:', error);
      setFollowStatus(prevFollowStatus);
      setProfileData((prev) => ({ ...prev, followers: prevFollowers }));
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${userid}`;
    navigator.clipboard.writeText(profileUrl).then(() => {
      toast.success('Profile link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileUpdate = async () => {
    if (!token) {
      toast.error('Please login to update profile');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const response = await axios.post(`${import.meta.env.VITE_API}/api/updateprofile`, {
        fullname: editFormData.fullname,
        bio: editFormData.bio,
        dob: editFormData.dob,
        gender: editFormData.gender,
        token,
      });

      if (response.data.user) {
        setProfileData((prev) => ({
          ...prev,
          fullname: editFormData.fullname || prev.fullname,
          bio: editFormData.bio || prev.bio,
          dob: editFormData.dob || prev.dob,
          gender: editFormData.gender || prev.gender,
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

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(true);
  };

  const getFollowButtonText = () => {
    if (followStatus.isFollowing) return 'Following';
    if (followStatus.isPending) return 'Requested';
    return 'Follow';
  };

  const getFollowButtonClass = () => {
    if (followStatus.isFollowing) {
      return 'bg-white text-black border border-gray-300 hover:bg-gray-100';
    }
    if (followStatus.isPending) {
      return 'bg-gray-200 text-gray-800';
    }
    return 'bg-blue-600 text-white hover:bg-blue-700';
  };

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

  const handlePostClick = (postid) => {
    navigate(`/show-post/${postid}`);
  };

  const followersCount = profileData.followers?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      
      {showEditProfile && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 sm:scale-100 shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullname"
                    value={editFormData.fullname}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={editFormData.bio}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                    placeholder="Tell us about yourself"
                    rows="4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={editFormData.dob}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={editFormData.gender}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={isUpdatingProfile}
                    className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors duration-200 ${
                      isUpdatingProfile ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
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
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full transform transition-all duration-300 scale-95 sm:scale-100 shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Confirm Logout</h2>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              <p className="text-gray-600 text-base mb-6">Are you sure you want to log out?</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-transform duration-200 transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-transform duration-200 transform hover:scale-105"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-8 hover:shadow-lg transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-shrink-0 relative">
              <img
                src={profileData.profilepic || '/default-avatar.png'}
                alt="Profile"
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-md"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.png';
                }}
              />
              {isOwnProfile && (
                <>
                  <label
                    htmlFor="profile-pic-upload"
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors duration-200 shadow-md"
                    title="Update profile picture"
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
                  {profileData.bio && (
                    <p className="text-gray-600 mt-2 text-base leading-relaxed max-w-md">{profileData.bio}</p>
                  )}
                  {profileData.website && (
                    <a
                      href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline mt-2 block text-sm sm:text-base"
                    >
                      {profileData.website}
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {isOwnProfile ? (
                    <>
                      <button
                        onClick={handleEditProfile}
                        className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-gray-100 hover:bg-gray-200 transition-transform duration-200 transform hover:scale-105"
                      >
                        <FaEdit /> Edit Profile
                      </button>
                      <button
                        onClick={handleLogoutConfirm}
                        className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-red-100 text-red-600 hover:bg-red-200 transition-transform duration-200 transform hover:scale-105"
                      >
                        <FaSignOutAlt /> Logout
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleFollow}
                      disabled={isProcessing}
                      className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium text-sm ${getFollowButtonClass()} transition-transform duration-200 transform hover:scale-105 ${
                        isProcessing ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {followStatus.isFollowing ? (
                        <FaHeart className="text-red-500" />
                      ) : (
                        <FaRegHeart />
                      )}
                      {getFollowButtonText()}
                    </button>
                  )}
                  <button
                    onClick={handleShareProfile}
                    className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-gray-100 hover:bg-gray-200 transition-transform duration-200 transform hover:scale-105"
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
                  className="text-center cursor-pointer hover:text-blue-600 transition-colors duration-200"
                  onClick={() => navigate(`/followers/${userid}`)}
                >
                  <p className="font-bold text-lg sm:text-xl">{followersCount}</p>
                  <p className="text-gray-500 text-sm">Followers</p>
                </div>
                <div
                  className="text-center cursor-pointer hover:text-blue-600 transition-colors duration-200"
                  onClick={() => navigate(`/following/${userid}`)}
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
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => handlePostClick(post._id)}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                      <img
                        src={profileData.profilepic || '/default-avatar.png'}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/default-avatar.png';
                        }}
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-700">
                {isOwnProfile ? 'You have no posts yet' : 'No posts yet'}
              </h3>
              {isOwnProfile ? (
                <button
                  onClick={() => navigate('/create-post')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-transform duration-200 transform hover:scale-105"
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