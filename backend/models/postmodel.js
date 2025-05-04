const mongoose = require("mongoose");
const { Schema } = mongoose;

const postSchema = new Schema(
  {
    heading: { type: String },
    fileUrl: { type: String },    
    thumbnail:{type:String},
    content:{type:String},
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, required: true, trim: true }
      },
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downloadedby: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
