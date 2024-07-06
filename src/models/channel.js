const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Profile = require('./profile');

const Channel = sequelize.define('Channel', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    followers: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: [],
    },
    adminId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    isSuspended: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    bannedUsers: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: [],
    },
    mutedUsers: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: [],
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
});

Channel.belongsTo(Profile, { foreignKey: 'ownerId', as: 'owner' });
Profile.hasMany(Channel, { foreignKey: 'ownerId', as: 'channels' });

module.exports = Channel;
