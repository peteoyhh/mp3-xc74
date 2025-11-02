// routes/users.js
const mongoose = require('mongoose');
const User = require('../models/user');
const Task = require('../models/task');
const { buildQuery } = require('./utils');

module.exports = function (router) {

  router.route('/users')
    // GET all users or count
    .get(async (req, res) => {
      try {
        if (req.query.count === 'true') {
          const count = await buildQuery(User, req).countDocuments();
          return res.status(200).json({ message: 'OK', data: count });
        }

        const result = await buildQuery(User, req).exec();
        const data = Array.isArray(result) ? result : [result];
        return res.status(200).json({ message: 'OK', data });
      } catch (err) {
        return res.status(400).json({ message: err.message, data: [] });
      }
    })

    // POST create new user
    .post(async (req, res) => {
      try {
        const { name, email, pendingTasks } = req.body;
        if (!name || !email)
          return res.status(400).json({ message: 'Name and email are required', data: [] });

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing)
          return res.status(400).json({ message: 'Email already exists', data: [] });

        const newUser = new User({
          name,
          email: email.toLowerCase(),
          pendingTasks: Array.isArray(pendingTasks) ? pendingTasks : [],
          dateCreated: new Date()
        });

        const savedUser = await newUser.save();

        // if tasks assigned, update them
        if (savedUser.pendingTasks.length > 0) {
          await Task.updateMany(
            { _id: { $in: savedUser.pendingTasks } },
            { assignedUser: savedUser._id.toString(), assignedUserName: savedUser.name }
          );
        }

        return res.status(201).json({ message: 'User created', data: savedUser });
      } catch (err) {
        return res.status(500).json({ message: 'Server error creating user', data: err.message });
      }
    });

  // GET / PUT / DELETE by id
  router.route('/users/:id')
    .get(async (req, res) => {
      try {
        const select = req.query.select ? JSON.parse(req.query.select) : null;
        const user = await User.findById(req.params.id, select || undefined).lean();
    
        if (!user)
          return res.status(404).json({ message: 'User not found', data: [] });
    
        // enforce field order for response
        const orderedUser = {
          _id: user._id,
          name: user.name,
          email: user.email,
          pendingTasks: user.pendingTasks,
          dateCreated: user.dateCreated
        };
    
        return res.status(200).json({ message: 'OK', data: orderedUser });
      } catch {
        return res.status(400).json({ message: 'Invalid request', data: [] });
      }
    })

    .put(async (req, res) => {
      try {
        const { name, email, pendingTasks } = req.body;
        if (!name || !email)
          return res.status(400).json({ message: 'Name and email are required', data: [] });

        const user = await User.findById(req.params.id);
        if (!user)
          return res.status(404).json({ message: 'User not found', data: [] });

        const conflict = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
        if (conflict)
          return res.status(400).json({ message: 'Email already exists', data: [] });

        // unassign old tasks
        if (Array.isArray(user.pendingTasks) && user.pendingTasks.length > 0) {
          const validOldTasks = user.pendingTasks.filter(id => mongoose.Types.ObjectId.isValid(id));
          if (validOldTasks.length > 0) {
            await Task.updateMany(
              { _id: { $in: validOldTasks } },
              { assignedUser: '', assignedUserName: 'unassigned' }
            );
          }
        }

        user.name = name;
        user.email = email.toLowerCase();
        user.pendingTasks = Array.isArray(pendingTasks) ? pendingTasks : [];

        const savedUser = await user.save();

        // assign new tasks
        if (savedUser.pendingTasks.length > 0) {
          await Task.updateMany(
            { _id: { $in: savedUser.pendingTasks } },
            { assignedUser: savedUser._id.toString(), assignedUserName: savedUser.name }
          );
        }

        return res.status(200).json({ message: 'User updated', data: savedUser });
      } catch (err) {
        return res.status(500).json({ message: 'Server error updating user', data: err.message });
      }
    })

    .delete(async (req, res) => {
      try {
        const user = await User.findById(req.params.id);
        if (!user)
          return res.status(404).json({ message: 'User not found', data: [] });

        // unassign all their tasks
        if (Array.isArray(user.pendingTasks) && user.pendingTasks.length > 0) {
          const validTaskIds = user.pendingTasks.filter(id => mongoose.Types.ObjectId.isValid(id));
          if (validTaskIds.length > 0) {
            await Task.updateMany(
              { _id: { $in: validTaskIds } },
              { assignedUser: '', assignedUserName: 'unassigned' }
            );
          }
        }

        await user.deleteOne();
        return res.status(200).json({ message: 'User deleted', data: [] });
      } catch (err) {
        return res.status(500).json({ message: 'Server error deleting user', data: err.message });
      }
    });

  return router;
};