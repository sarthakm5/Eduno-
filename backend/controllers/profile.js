const usermodel = require('../models/usermodel');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const profile = async (req, res) => {
  try {
    const { userid, token } = req.body;

    
    if (!userid || !mongoose.Types.ObjectId.isValid(userid)) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid User ID is required' 
      });
    }

    
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

    
    const followerDetails = await Promise.all(
      user.followers.map(async followerId => {
        const follower = await usermodel.findById(followerId)
          .select('profilepic fullname username _id')
          .lean();
        return {
          userId: follower._id,
          name: follower.fullname,
          username: follower.username,
          profilepic: follower.profilepic
        };
      })
    );

    
    const followingDetails = await Promise.all(
      user.following.map(async followingId => {
        const following = await usermodel.findById(followingId)
          .select('profilepic fullname username _id')
          .lean();
        return {
          userId: following._id,
          name: following.fullname,
          username: following.username,
          profilepic: following.profilepic
        };
      })
    );

    
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
          isPending = user.pendingfollows && 
            user.pendingfollows.some(pendingId => 
              pendingId.toString() === currentUserId
            );
        }
      } catch (error) {
        console.error('Token verification error:', error);
      }
    }

    
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
