const Post = require('../models/postmodel');

const getAllPosts = async (req, res) => {
    const postid=req.body.postid
    if(!postid){
        res.status(400).json({message:"please provide postid"})
    }
    
    try {
       
        const posts = await Post.findById({_id:postid})
            .populate("user", "username profilepic fullname")
            .sort({ createdAt: -1 });
        
        if (!posts || posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No posts found"
            });
        }

        res.status(200).json({
            success: true,
            count: posts.length,
            posts: posts
        });

    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

module.exports = getAllPosts;