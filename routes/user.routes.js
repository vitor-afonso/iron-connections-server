//jshint esversion:9

const mongoose = require('mongoose');
const router = require('express').Router();

const User = require('../models/User.model');

const { isAuthenticated } = require('../middleware/jwt.middleware.js');

router.get('/users', isAuthenticated, async (req, res, next) => {
  try {
    //populates nested arrays
    const response = await User.find().populate({
      path: 'posts',
      populate: [
        {
          path: 'comments',
          model: 'Comment',
        },
        {
          path: 'userId',
          model: 'User',
        },
      ],
    });
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Ops!! Something whent wrong.' });
  }
});

/************************** GET ONE USER *********************************/
router.get('/users/:userId', isAuthenticated, async (req, res, next) => {
  const { userId } = req.params;

  try {
    const response = await User.findById(userId)
      .populate([
        {
          path: 'followers',
        },
        {
          path: 'posts',
          populate: [
            {
              path: 'comments',
              model: 'Comment',
              populate: {
                path: 'userId',
                model: 'User',
              },
            },
            {
              path: 'userId',
              model: 'User',
            },
          ],
        },
        {
          path: 'notifications',
          populate: {
            path: 'postId',
            model: 'Post',
          },
        },
      ])

      .sort({ createdAt: -1 });
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Ops!! Something whent wrong.' });
  }
});

/************************** CREATE NEW USER *********************************/
router.post('/users', isAuthenticated, async (req, res, next) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      res.status(401).json({ message: 'Missing fields' });
      return;
    }

    let response = await User.create({ username, password, email, followers: [], posts: [] });

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

/************************** UPDATE USER *********************************/
router.put('/users/:userId', isAuthenticated, async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Specified id is not valid' });
      return;
    }

    if (req.body) {
      let response = await User.findByIdAndUpdate(userId, req.body, { new: true });
      res.status(200).json({ response });
    }
  } catch (error) {
    res.status(500).json({ message: 'Ops!! Something whent wrong.' });
  }
});

/************************** ADD USER FOLLOWERS *********************************/
router.put('/users/:userId/add-follower', isAuthenticated, async (req, res, next) => {
  let followerId = req.query.followerId;

  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Specified id is not valid' });
      return;
    }

    let response = await User.findByIdAndUpdate(userId, { $push: { followers: followerId } }, { new: true });

    res.status(200).json({ message: `User successfully updated  => ${response}.` });
  } catch (error) {
    res.status(500).json({ message: 'Ops!! Something whent wrong.' });
  }
});

/************************** REMOVE USER FOLLOWERS *********************************/
router.put('/users/:userId/remove-follower', isAuthenticated, async (req, res, next) => {
  let followerId = req.query.followerId;

  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Specified id is not valid' });
      return;
    }

    let response = await User.findByIdAndUpdate(userId, { $pull: { followers: followerId } }, { new: true });

    res.status(200).json({ message: `User successfully updated  => ${response}.` });
  } catch (error) {
    res.status(500).json({ message: 'Ops!! Something whent wrong.' });
  }
});

/************************** UPDATE USER LIKES ADD *********************************/
router.put('/users/:userId/add-like', isAuthenticated, async (req, res, next) => {
  let postId = req.body.postId;

  try {
    const { userId } = req.params; // <= id of user that will receive notification

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Specified id is not valid' });
      return;
    }

    let response = await User.findByIdAndUpdate(userId, { $push: { likes: postId } }, { new: true });

    res.status(200).json({ message: `User likes successfully updated  => ${response}.` });
  } catch (error) {
    res.status(500).json({ message: 'Ops!! Something whent wrong.' });
  }
});

/************************** UPDATE USER LIKES REMOVE *********************************/
router.put('/users/:userId/remove-like', isAuthenticated, async (req, res, next) => {
  let postId = req.body.postId;

  try {
    const { userId } = req.params; // <= id of user that will receive notification

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Specified id is not valid' });
      return;
    }

    let response = await User.findByIdAndUpdate(userId, { $pull: { likes: postId } }, { new: true });

    res.status(200).json({ message: `User likes successfully updated  => ${response}.` });
  } catch (error) {
    res.status(500).json({ message: 'Ops!! Something whent wrong.' });
  }
});

/************************** REMOVE USER NOTIFICATION *********************************/
router.put('/users/:userId/remove-notification', isAuthenticated, async (req, res, next) => {
  let { notificationId } = req.body;
  console.log('notification to be removed =>', notificationId);
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Specified id is not valid' });
      return;
    }

    let response = await User.findByIdAndUpdate(userId, { $pull: { notifications: notificationId } }, { new: true });

    res.status(200).json({ message: `User notifications successfully updated  => ${response}.`, response });
  } catch (error) {
    res.status(500).json({ message: 'Ops!! Something whent wrong.' });
  }
});

/************************** DELETE USER *********************************/
router.delete('/users/:userId', isAuthenticated, async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Specified id is not valid' });
      return;
    }
    await User.findByIdAndRemove(userId);

    res.status(200).json({ message: `User with id: ${req.params.userId} was deleted.` });
  } catch (error) {
    res.status(500).json({ message: 'Ops!! Something whent wrong.' });
  }
});

module.exports = router;
