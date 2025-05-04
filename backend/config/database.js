const mongoose=require("mongoose");

const dburi=process.env.DB_URI;

const dbconnect=async(req,res)=>{
    try{
        console.log(process.env.DB_URI)
        await mongoose.connect(`${dburi}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("db connected successfully")
    }
    catch(err){
        console.log(`database connection error ${err}`)
    }
}

module.exports = dbconnect