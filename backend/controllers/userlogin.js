const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const usermodel = require('../models/usermodel');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const userdata = await usermodel.findOne({ username });

        if (!userdata) {
            return res.status(400).json({ message: "Username or password is incorrect" });
        }

        const isPasswordMatch = await bcrypt.compare(password, userdata.password);
        
        if (!isPasswordMatch) {
            return res.status(400).json({ message: "Username or password is incorrect" });
        }

        const payload = { 
            userId: userdata._id, // Use userId instead of useremail
            username: userdata.username 
        };
        
        const token = jwt.sign(payload, process.env.JWT)
        

        res.status(200).json({ 
            message: "Login successful", 
            token,
            user: { // Send minimal user data
                _id: userdata._id,
                username: userdata.username
            }
        });
    
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = login;