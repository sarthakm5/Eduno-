const Post = require('../models/postmodel');
const User = require('../models/usermodel');
const jwt = require('jsonwebtoken');

// Add a new comment
const addComment = async (req, res) => {
    const { token, commenttext, postid } = req.body;
    
    // Validate input
    if (!token || !commenttext || !postid) {
        return res.status(400).json({ 
            success: false,
            message: 'Token, comment text, and post ID are required' 
        });
    }

    try {
        // Verify and decode token
        const decoded = jwt.verify(token, process.env.JWT);
        if (!decoded) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid token' 
            });
        }

        // Find user
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Find post
        const post = await Post.findById(postid);
        if (!post) {
            return res.status(404).json({ 
                success: false,
                message: 'Post not found' 
            });
        }

        // Create new comment
        const newComment = {
            user: {
                _id: user._id,
                username: user.username,
                profilepic: user.profilepic,
                fullname:user.fullname
            },
            text: commenttext,
            createdAt: new Date()
        };

        // Add comment to post
        post.comments.push(newComment);
        await post.save();

        // Add notification if not commenting on own post
        if (post.user.toString() !== user._id.toString()) {
            const postAuthor = await User.findById(post.user);
            if (postAuthor) {
                postAuthor.notification.push({
                    type: 'comment',
                    from: user._id,
                    post: post._id,
                    message: `${user.username} commented on your post`,
                    read: false
                });
                await postAuthor.save();
            }
        }

        // Return success response with the new comment
        return res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            comment: newComment
        });

    } catch (error) {
        console.error('Error adding comment:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message 
        });
    }
};

// Get all comments for a post

// Delete a comment
const deleteComment = async (req, res) => {
    const { token } = req.body;
    const { postid, commentid } = req.params;

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT);
        if (!decoded) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid token' 
            });
        }

        // Find post
        const post = await Post.findById(postid);
        if (!post) {
            return res.status(404).json({ 
                success: false,
                message: 'Post not found' 
            });
        }

        // Find comment
        const commentIndex = post.comments.findIndex(
            c => c._id.toString() === commentid
        );

        if (commentIndex === -1) {
            return res.status(404).json({ 
                success: false,
                message: 'Comment not found' 
            });
        }

        // Check if user is comment author or post owner
        const comment = post.comments[commentIndex];
        const isAuthor = comment.user._id.toString() === decoded.userId;
        const isPostOwner = post.user.toString() === decoded.userId;

        if (!isAuthor && !isPostOwner) {
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized to delete this comment' 
            });
        }

        // Remove comment
        post.comments.splice(commentIndex, 1);
        await post.save();

        return res.status(200).json({
            success: true,
            message: 'Comment deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message 
        });
    }
};

module.exports = {
    addComment,
   
    deleteComment
};