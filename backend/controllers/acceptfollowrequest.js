const usermodel = require("../models/usermodel");
const jwt = require("jsonwebtoken");

const acceptFollowRequest = async (req, res) => {
  const { token, requestingUserId } = req.body;

  // Validate input
  if (!token || !requestingUserId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Verify token and get current user
    const decoded = jwt.verify(token, process.env.JWT);
    if (!decoded || !decoded.username) {
      return res.status(400).json({ message: "Error decoding token" });
    }

    const currentUser = await usermodel.findOne({ username: decoded.username });
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    // Find the user who sent the follow request
    const requestingUser = await usermodel.findById(requestingUserId);
    if (!requestingUser) {
      return res.status(404).json({ message: "Requesting user not found" });
    }

    // Check if the requesting user is in pending follows
    if (!currentUser.pendingfollows.includes(requestingUserId)) {
      return res.status(400).json({ message: "No pending follow request from this user" });
    }

    // Remove from pendingfollows and add to followers
    currentUser.pendingfollows.pull(requestingUserId);
    currentUser.followers.push(requestingUserId);
    
    // Add current user to requesting user's following list
    requestingUser.following.push(currentUser._id);

    // Add notifications
    currentUser.notification.push(`You accepted ${requestingUser.username}'s follow request`);
    requestingUser.notification.push(`${currentUser.username} accepted your follow request`);

    // Save both users
    await Promise.all([currentUser.save(), requestingUser.save()]);

    res.status(200).json({ 
      message: "Follow request accepted successfully",
      followerCount: currentUser.followers.length,
      followingCount: requestingUser.following.length
    });

  } catch (err) {
    res.status(500).json({ 
      message: "Error processing follow request acceptance",
      error: err.message 
    });
  }
};

module.exports = acceptFollowRequest;