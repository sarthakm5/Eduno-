const User = require("../models/usermodel");
const jwt = require("jsonwebtoken");

const updateprofile = async (req, res) => {
  try {
    let { fullname, bio, dob, token, gender } = req.body;

    if (!token) {
      return res.status(400).json({ message: "token is not provided" });
    }

    if (!fullname && !bio && !dob && !gender) {
      return res.status(400).json({ message: "nothing to update" });
    }

    const decoded = jwt.verify(token, process.env.JWT);

    let updatedfullname = null;
    let updatedbio = null;
    let updateddob = null;
    let updatedgender = null;
    let dateofB=null;



    if (fullname) {
      updatedfullname = await User.findOneAndUpdate(
        { username: decoded.username },
        { fullname },
        { new: true }
      );
    }

    if (bio) {
      updatedbio = await User.findOneAndUpdate(
        { username: decoded.username },
        { bio },
        { new: true }
      );
    }

    if (dob) {
      dateofB=dob.toString();
      updateddob = await User.findOneAndUpdate(
        { username: decoded.username },
        { dob: dateofB},
        { new: true }
      );
    }

    if (gender) {
      updatedgender = await User.findOneAndUpdate(
        { username: decoded.username },
        { gender },
        { new: true }
      );
    }

    res.status(200).json({
      message: "profile updated successfully",
      fullname: updatedfullname?.fullname,
      dob: updateddob?.dob,
      gender: updatedgender?.gender,
      bio: updatedbio?.bio,
    });
  } catch (err) {
    res.status(500).json({ message: "internal server error", error: err.message });
  }
};

module.exports = updateprofile;
