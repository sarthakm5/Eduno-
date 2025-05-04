const usermodel = require("../models/usermodel");
const jwt = require("jsonwebtoken");

const getUser = async (req, res) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT);
    const user = await usermodel.findOne({ username: decoded.username })
      .select('likedpost savedpost following');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({
      likedpost: user.likedpost,
      savedPosts: user.savedpost,
      following: user.following,
      userid:user._id
      
    });
  } catch (err) {
    res.status(400).json({ message: `Error: ${err.message}` });
  }
};

module.exports = getUser;