const jwt = require('jsonwebtoken');
const ProfileService = require('../services/profileService');
require('dotenv').config();

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization') ? req.header('Authorization').replace('Bearer ', '') : null
    if (!token) {
        return res.status(401).send({ error: 'Access denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await ProfileService.fetchProfile(decoded.id)
        req.user = user.dataValues;
        next();
    } catch (ex) {
        res.status(400).send({ error: 'Invalid token' });
    }
};




const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        return next();
    }
    return res.status(403).json({ error: 'Unauthorized' });
}
module.exports = { authMiddleware, isSuperAdmin };
