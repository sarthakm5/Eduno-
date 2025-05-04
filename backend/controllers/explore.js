const usermodel=require('../models/usermodel');
const jwt=require('jsonwebtoken');

const explore=async (req,res)=>{
    try{
        const User=await usermodel.find();

        const filteredUser=User.map(user=>({
            username:user.username,
        fullname:user.fullname,
        profilepic:user.profilepic,
        userid:user._id
        }))

    res.status(200).json({
        filteredUser
    })
    }catch(error){
        res.status(400).json(error)
    }
}

module.exports=explore