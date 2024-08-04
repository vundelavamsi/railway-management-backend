const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'railway_management.sqlite'
});

module.exports = sequelize;
