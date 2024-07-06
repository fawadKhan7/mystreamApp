const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Profile = sequelize.define('Profile', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    fullName: DataTypes.STRING,
    username: {
        type: DataTypes.STRING,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
    },
    password: DataTypes.STRING,
    avatar: DataTypes.STRING,
    active: DataTypes.BOOLEAN,
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    twoFactorSecret: DataTypes.STRING,
    following: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: [],
    },
    pushSubscription: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    role: {
        type: DataTypes.ENUM('user', 'host', 'superadmin'),
        defaultValue: 'user',
    }
    // ,
    // isMuted: {
    //     type: DataTypes.BOOLEAN,
    //     defaultValue: false,
    // },
    // isBanned: {
    //     type: DataTypes.BOOLEAN,
    //     defaultValue: false,
    // },
}, {
    timestamps: true,
});

module.exports = Profile;
