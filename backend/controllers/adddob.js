const User = require('../models/usermodel');
const jwt = require('jsonwebtoken');

const dob = async (req, res) => {
  const { token, dob } = req.body;

  if (!token || !dob) {
    return res.status(400).json({ message: 'Token and DOB are required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT);
    const userId=decoded.userId
    

    const parsedDob = new Date(dob);
    if (isNaN(parsedDob.getTime())) {
      return res.status(400).json({ message: 'Invalid DOB format' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { dob: parsedDob },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'DOB updated successfully', user: updatedUser });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
        console.log(error)
      return res.status(401).json({ message: 'Invalid token' });
      
    }
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = dob ;