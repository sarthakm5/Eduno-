const { mongoose, Schema } = require("mongoose");
const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    fullname:{
        type:String,
        required:true
    },
    bio:{
        type:String,
        default:""
    },
    profilepic: {  
        type: String, 
        default: null 
    },
    gender:{
        type:String
    },
    dob:{
        type:String
    },
    followers:[],
    following:[],
    post:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Post"
    }],

    notification:[],
    
    colortheme:{
        type:String,
        
    },
    pendingfollows:[],
    pendingfollowing:[],
    likedpost:[{type:mongoose.Schema.Types.ObjectId,ref:"Post"}],
    password:{
        type:String,
        
    },
    savedpost:[{type:mongoose.Schema.Types.ObjectId,ref:"Post"}]
    
});



module.exports = mongoose.model("User", userSchema);
