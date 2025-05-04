const Post = require('../models/postmodel');
const User = require('../models/usermodel');
const jwt = require('jsonwebtoken');

const homepage = async (req, res) => {
  try {
    const token = req.body.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT);
      console.log("Decoded Token:", decoded);
    } catch (jwtError) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const user = await User.findOne({ username: decoded.username });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const allPosts = await Post.find()
      .populate("user", "username  followers following profilepic")
      .populate("comments.user", "username profilepic")
      .sort({ createdAt: -1 });

    const filteredPosts = allPosts.filter(post => {
      if (!post.user) return false;
      const postAuthor = post.user;
      return true;
    });

    const transformedPosts = filteredPosts.map(post => ({
      _id: post._id,
      heading: post.heading || "",
      filename: post.fileUrl || "",
      postmessage: post.content,
      thumbnail: post.thumbnail || "",
      user: {
        _id: post.user._id,
        username: post.user.username,
        profilePic: post.user.profilepic || null
      },
      comments: post.comments.map(comment => ({
        _id: comment._id,
        text: comment.text,
        user: comment.user ? {
          _id: comment.user._id,
          username: comment.user.username,
          profilePic: comment.user.profilePic || null
        } : null
      })),
      likes: post.likes || [],
      savedby: post.savedby || [],
      isLiked: post.likes?.includes(user._id) || false,
      isSaved: post.savedby?.includes(user._id) || false,
      canDelete: user.isAdmin || post.user._id.toString() === user._id.toString(),
      createdAt: post.createdAt
    }));

    res.status(200).json({ 
      success: true, 
      posts: transformedPosts,
      isAdmin: user.isAdmin || false
    });

  } catch (error) {
    console.error('Homepage Controller Error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const token = req.body.token;
    const postId = req.params.postId;

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT);
    const user = await User.findOne({ username: decoded.username });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (!user.isAdmin && post.user.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this post" });
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ success: true, message: "Post deleted successfully" });

  } catch (error) {
    console.error('Delete Post Error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { homepage, deletePost };