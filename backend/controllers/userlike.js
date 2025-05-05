const postmodel = require('../models/postmodel');
const usermodel = require('../models/usermodel');
const jwt = require('jsonwebtoken');

const likes = async (req, res) => {
  const { token, postid } = req.body;
  
  // Validate input
  if (!token || !postid) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT);
    if (!decoded || !decoded.username) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Find user with session
    const user = await usermodel.findOne({ username: decoded.username }).session();
    if (!user) {
      return res.status(404).json({ message: "No user found with this username" });
    }

    // Find post with session
    const post = await postmodel.findById(postid).session();
    if (!post) {
      return res.status(404).json({ message: "No post found with this ID" });
    }

    // Find post author with session
    const postAuthor = await usermodel.findById(post.user).session();
    if (!postAuthor) {
      return res.status(404).json({ message: "Post author not found" });
    }

    // Start a transaction
    const session = await usermodel.startSession();
    session.startTransaction();

    try {
      
      if (post.likes.includes(user._id)) {
       
        await postmodel.findByIdAndUpdate(
          postid,
          { $pull: { likes: user._id } },
          { session }
        );

        await usermodel.findByIdAndUpdate(
          user._id,
          { $pull: { likedpost: post._id } },
          { session }
        );

        
        postAuthor.notification = postAuthor.notification.filter(
          notif => typeof notif === 'string' && !notif.includes(`${user.username} liked your post`)
        );
        await postAuthor.save({ session });
      } else {
        
        await postmodel.findByIdAndUpdate(
          postid,
          { $addToSet: { likes: user._id } },
          { session }
        );

        await usermodel.findByIdAndUpdate(
          user._id,
          { $addToSet: { likedpost: post._id } },
          { session }
        );

        postAuthor.notification.push({
          type: 'like',
          from: user._id,
          post: post._id,
          message: `${user.username} liked your post `,
          read: false
      });
        await postAuthor.save({ session });
      }

   
      await session.commitTransaction();
      session.endSession();

      
      const updatedPost = await postmodel.findById(postid)
        .populate('likes', 'username')
        .populate('user', 'username profilepic');

      return res.status(200).json({ 
        message: "Operation successful",
        post: updatedPost
      });

    } catch (err) {
      // If anything goes wrong, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw err;
    }

  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
};

module.exports = likes;
