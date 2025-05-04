const Post= require('../models/postmodel')
const getComments = async (req, res) => {


    const  postid  = req.query;

    if(!postid){
        res.status(400).json({message:"postid to dede BKL"})
    }
    

    try {
        
        const post = await Post.findById(postid.postid)
            .select('comments')
            .populate('comments.user', 'username profilepic fullname');

        if (!post) {
            res.status(404).json({ 
                success: false,
                message: 'Post not found' 
            });
        }

        // Sort comments by newest first
        const sortedComments = post.comments.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.status(200).json({
            success: true,
            comments: sortedComments
        });

    } catch (error) {
        console.error('Error fetching comments:', error);
         res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message 
        });
    }
};

module.exports=getComments