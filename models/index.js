const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, unique: true },
    password: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true },
    role: { type: DataTypes.STRING, defaultValue: 'user' }
});

const Train = sequelize.define('Train', {
    train_name: DataTypes.STRING,
    source: DataTypes.STRING,
    destination: DataTypes.STRING,
    seat_capacity: DataTypes.INTEGER,
    arrival_time_at_source: DataTypes.TIME,
    arrival_time_at_destination: DataTypes.TIME,
    available_seats: { type: DataTypes.INTEGER, defaultValue: 0 }
});

const Booking = sequelize.define('Booking', {
    user_id: DataTypes.INTEGER,
    train_id: DataTypes.INTEGER,
    no_of_seats: DataTypes.INTEGER,
    seat_numbers: DataTypes.JSON(DataTypes.INTEGER)
});

User.hasMany(Booking, { foreignKey: 'user_id' });
Train.hasMany(Booking, { foreignKey: 'train_id' });

sequelize.sync();

module.exports = { User, Train, Booking };
