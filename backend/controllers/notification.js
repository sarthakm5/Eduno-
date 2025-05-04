const user = require('../models/usermodel');
const jwt = require('jsonwebtoken');

const notification = async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT);
        if (!decoded) {
            return res.status(401).json({ message: "Invalid token" });
        }

        // Find user with notifications sorted by latest first
        const usermodel = await user.findById(decoded.userId)
            .select('notification')
            .sort({ 'notification.createdAt': -1 });

        if (!usermodel) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ 
            message: "Notifications fetched successfully", 
            body: usermodel.notification || [] 
        });

    } catch (err) {
        console.error('Notification error:', err);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

const clearNotifications = async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        const decoded = jwt.verify(token, process.env.JWT);
        if (!decoded) {
            return res.status(401).json({ message: "Invalid token" });
        }

        await user.findByIdAndUpdate(decoded.userId, {
            $set: { notification: [] }
        });

        res.status(200).json({ message: "Notifications cleared successfully" });

    } catch (err) {
        console.error('Clear notifications error:', err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    notification,
    clearNotifications
};