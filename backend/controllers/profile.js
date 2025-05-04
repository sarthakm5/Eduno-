const usermodel = require('../models/usermodel');
const jwt = require('jsonwebtoken');

const profile = async (req, res) => {
  const { userid, token } = req.body;

  if (!userid) {
    return res.status(400).json({ 
      success: false,
      message: 'User ID is required' 
    });
  }


  try {
    const user = await usermodel.findById(userid)
      .populate('post')
      .select('-password -__v -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    let isOwnProfile = false;
    let isFollowing = false;
    let isPending = false;
    let currentUserId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT);
        const currentUserId=decoded.userId        
        isOwnProfile = currentUserId == userid.toString();
        
        if (!isOwnProfile) {
          isFollowing = user.followers.includes(currentUserId);
          isPending = user.pendingfollows.includes(currentUserId);
        }
      } catch (error) {
        console.error('Token verification error:', error);
      }
    }

    const responseData = {
      success: true,
      message: 'User profile fetched successfully',
      body: { user },
      isOwnProfile,
      isFollowing,
      isPending,
      currentUserId
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