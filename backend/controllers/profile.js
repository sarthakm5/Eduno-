const usermodel = require('../models/usermodel');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const profile = async (req, res) => {
  try {
    const { userid, token } = req.body;

    // Validate userid
    if (!userid || !mongoose.Types.ObjectId.isValid(userid)) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid User ID is required' 
      });
    }

    // Fetch user (exclude sensitive fields)
    const user = await usermodel.findById(userid)
      .populate('post')
      .select('-password -__v -resetPasswordToken -resetPasswordExpires')
      .lean();

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Fetch followers and following in parallel (optimized with $in)
    const [followerDetails, followingDetails] = await Promise.all([
      // Followers
      user.followers?.length > 0 
        ? usermodel.find({ _id: { $in: user.followers } })
            .select('profilepic fullname username _id')
            .lean()
            .then(users => users.map(user => ({
              userId: user._id,
              name: user.fullname,
              username: user.username,
              profilepic: user.profilepic
            })))
        : [],
      
      // Following
      user.following?.length > 0 
        ? usermodel.find({ _id: { $in: user.following } })
            .select('profilepic fullname username _id')
            .lean()
            .then(users => users.map(user => ({
              userId: user._id,
              name: user.fullname,
              username: user.username,
              profilepic: user.profilepic
            })))
        : []
    ]);

    // Token and relationship checks
    let isOwnProfile = false;
    let isFollowing = false;
    let isPending = false;
    let currentUserId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT);
        currentUserId = decoded.userId.toString();
        isOwnProfile = currentUserId === userid.toString();
        
        if (!isOwnProfile) {
          isFollowing = user.followers.some(followerId => 
            followerId.toString() === currentUserId
          );
          isPending = (user.pendingfollows || []).some(pendingId => 
            pendingId.toString() === currentUserId
          );
        }
      } catch (error) {
        console.error('Token verification error:', error);
        // Uncomment to enforce token validity:
        // return res.status(401).json({ success: false, message: 'Invalid token' });
      }
    }

    // Response
    const responseData = {
      success: true,
      message: 'User profile fetched successfully',
      body: {
        user: {
          ...user,
          _id: user._id,
          followers: followerDetails,
          following: followingDetails,
          post: user.post || [],
          likedpost: user.likedpost || [],
          savedpost: user.savedpost || []
        },
        isOwnProfile,
        isFollowing,
        isPending,
        currentUserId
      }
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = profile;
