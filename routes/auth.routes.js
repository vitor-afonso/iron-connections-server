//jshint esversion:9

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const jwt = require('jsonwebtoken'); //<= to create and sign new JSON Web Tokens
const { isAuthenticated } = require('./../middleware/jwt.middleware.js');

const saltRounds = 10;

// POST /auth/signup  - Creates a new user in the database
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    // Check if email or password or username are provided as empty string
    if (email === '' || password === '' || username === '') {
      res.status(400).json({ message: 'Provide email, password and username' });
      return;
    }

    // Use regex to validate the email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: 'Provide a valid email address.' });
      return;
    }

    // Use regex to validate the password format
    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    if (!passwordRegex.test(password)) {
      res.status(400).json({ message: 'Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.' });
      return;
    }

    if (!email || !password || !username) {
      res.status(400).json({ message: 'Missing fields' });
      return;
    }

    // Check the users collection if a user with the same email already exists
    let foundUser = await User.findOne({ email });

    // If the user with the same email already exists, send an error response
    if (foundUser) {
      res.status(400).json({ message: 'User already exists.' });
      return;
    }

    // If email is unique, proceed to hash the password
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create the new user in the database
    const createdUser = await User.create({
      email,
      username,
      password: hashedPassword,
    });

    res.status(200).json({
      email: createdUser.email,
      username: createdUser.username,
      id: createdUser._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { password, email } = req.body;

    // Check if email or password are provided as empty string
    if (!password || !email) {
      res.status(400).json({ message: 'Provide email and password.' });
      return;
    }

    // Check the users collection if a user with the same email exists
    let foundUser = await User.findOne({ email });

    if (!foundUser) {
      // If the user is not found, send an error response
      res.status(401).json({ message: 'Invalid login' });
      return;
    }

    // Compare the provided password with the one saved in the database
    const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

    if (passwordCorrect) {
      // Deconstruct the user object to omit the password
      const { _id, email, username, imageUrl, notifications, followers, posts } = foundUser;

      // Create an object that will be set as the token payload
      const payload = { _id, email, username, imageUrl, notifications, followers, posts };

      // Create and sign the token
      const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
        algorithm: 'HS256',
        expiresIn: '6h',
      });

      // Send the token as the response
      res.status(200).json({ authToken: authToken });
    } else {
      res.status(401).json({ message: 'Invalid login' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong while trying to login.' });
  }
});

router.get('/verify', isAuthenticated, (req, res, next) => {
  /* console.log(`req.payload`, req.payload); */
  res.status(200).json(req.payload);
});

module.exports = router;
