const express = require('express');
const { User, Train, Booking } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
require('dotenv').config();

const router = express.Router();


// Middleware to check admin API key
const checkAdminApiKey = (req, res, next) => {
    if (req.headers['x-api-key'] === process.env.ADMIN_API_KEY) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden' });
    }
};

// Middleware to authenticate user
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    console.log(token)
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        console.log(process.env.SECRET_KEY)
        if (err) return res.status(403).json({ message: 'Forbidden' });
        req.user = user;
        next();
    });
};

// Register User
router.post('/register', async (req, res) => {
    console.log(req.body)
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const user = await User.create({ username, password: hashedPassword, email });
        res.json({ status: 'Account successfully created', status_code: 200, user_id: user.id });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Login User
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.SECRET_KEY, { expiresIn: '1h' });
        res.json({ status: 'Login successful', status_code: 200, user_id: user.id, access_token: token });
    } else {
        res.status(401).json({ status: 'Incorrect username/password provided. Please retry', status_code: 401 });
    }
});

// Add a New Train (Admin only)
router.post('/add-train', checkAdminApiKey, async (req, res) => {
    const { train_name, source, destination, seat_capacity, arrival_time_at_source, arrival_time_at_destination } = req.body;
    try {
        const train = await Train.create({ train_name, source, destination, seat_capacity, arrival_time_at_source, arrival_time_at_destination, available_seats: seat_capacity });
        res.json({ message: 'Train added successfully', status_code: 200, train_id: train.id });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get Seat Availability
router.get('/seat-availability', async (req, res) => {
    const { source, destination } = req.query;
    try {
        const trains = await Train.findAll({ where: { source, destination } });
        res.json(trains.map(train => ({
            train_id: train.id,
            train_name: train.train_name,
            available_seats: train.available_seats
        })));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Book a Seat
router.post('/book-seat', authenticateToken, async (req, res) => {
    const { user_id, train_id, no_of_seats } = req.body;
    try {
        const train = await Train.findByPk(train_id);
        if (train && train.available_seats >= no_of_seats) {
            const bookedSeats = [];
            for (let i = 0; i < no_of_seats; i++) {
                bookedSeats.push(train.seat_capacity - train.available_seats + i + 1);
            }
            await Booking.create({ user_id, train_id, no_of_seats, seat_numbers: bookedSeats });
            await train.update({ available_seats: train.available_seats - no_of_seats });
            res.json({ message: 'Seat booked successfully', booking_id: booking.id, seat_numbers: bookedSeats });
        } else {
            res.status(400).json({ message: 'Not enough seats available' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get Specific Booking Details
router.get('/booking-details', authenticateToken, async (req, res) => {
    const { booking_id } = req.query;
    try {
        const booking = await Booking.findByPk(booking_id);
        console.log(booking)
        res.json({
            booking_id: booking.id,
            train_id: booking.train_id,
            no_of_seats: booking.no_of_seats,
            seat_numbers: booking.seat_numbers,
            // arrival_time_at_source: booking.Train.arrival_time_at_source,
            // arrival_time_at_destination: booking.Train.arrival_time_at_destination
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
