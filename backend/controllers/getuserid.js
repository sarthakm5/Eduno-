
const jwt=require('jsonwebtoken');


const getuserid=(req,res)=>{
    const {token}=req.body;
    if(!token){
        res.status(400).json({message:"pleasse give me the token"});
    }
    const decoded = jwt.verify(token, process.env.JWT);
    res.status(202).json({message:decoded.userId})
}

module.exports=getuserid