// app.js or sequelize.js

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
});

// Test the database connection
sequelize.authenticate()
    .then(() => console.log('Database connected...'))
    .catch(err => console.error('Unable to connect to the database:'));

// Synchronize models (if needed)
// sequelize.sync({ alter: true })
//     .then(() => console.log('All models were synchronized successfully.'))
//     .catch(err => console.error('Model synchronization error:', err));

module.exports = sequelize;
