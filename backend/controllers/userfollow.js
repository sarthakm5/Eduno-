const usermodel = require("../models/usermodel");
const jwt = require("jsonwebtoken");

const follow = async (req, res) => {
  const { token, userid } = req.body;
  
  if (!token || !userid) {
    return res.status(400).json({
      success: false,
      message: "Token and user ID are required"
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT);
    const currentUser = await usermodel.findOne({ username: decoded.username });
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    const targetUser = await usermodel.findById(userid);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found"
      });
    }

    // Check if user is trying to follow themselves
    if (currentUser._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself"
      });
    }

    const isFollowing = targetUser.followers.includes(currentUser._id);
    const isPending = targetUser.pendingfollows.includes(currentUser._id);
    let message = '';
    let updatedIsFollowing = isFollowing;
    let updatedIsPending = isPending;

    if (targetUser.isPrivate) {
      if (isPending) {
        // Cancel follow request
        await usermodel.findByIdAndUpdate(userid, {
          $pull: { pendingfollows: currentUser._id }
        });
        message = 'Follow request canceled';
        updatedIsPending = false;
      } else {
        // Send follow request
        await usermodel.findByIdAndUpdate(userid, {
          $addToSet: { pendingfollows: currentUser._id },
          $push: {
            notification: {
              type: 'follow_request',
              message: `${currentUser.username} wants to follow you`,
              userId: currentUser._id
            }
          }
        });
        message = 'Follow request sent';
        updatedIsPending = true;
      }
    } else {
      if (isFollowing) {
        // Unfollow
        await Promise.all([
          usermodel.findByIdAndUpdate(userid, {
            $pull: { followers: currentUser._id }
          }),
          usermodel.findByIdAndUpdate(currentUser._id, {
            $pull: { following: userid }
          })
        ]);
        message = 'user unfollowed';
        updatedIsFollowing = false;
      } else {
        // Follow
        await Promise.all([
          usermodel.findByIdAndUpdate(userid, {
            $addToSet: { followers: currentUser._id },
            $push: {
              notification: {
                type: 'follow',
                message: `${currentUser.username} started following you`,
                userId: currentUser._id
              }
            }
          }),
          usermodel.findByIdAndUpdate(currentUser._id, {
            $addToSet: { following: userid }
          })
        ]);
        message = 'user followed';
        updatedIsFollowing = true;
      }
    }

    res.status(200).json({
      success: true,
      message,
      isFollowing: updatedIsFollowing,
      isPending: updatedIsPending,
      currentUserId: currentUser._id.toString()
    });

  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = follow;