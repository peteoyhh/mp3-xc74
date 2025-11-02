// routes/tasks.js
const mongoose = require('mongoose');
const Task = require('../models/task');
const User = require('../models/user');
const { buildQuery } = require('./utils');

module.exports = function (router) {

  router.route('/tasks')
    .get(async (req, res) => {
      try {
        if (req.query.count === 'true') {
          const count = await buildQuery(Task, req).countDocuments();
          return res.status(200).json({ message: 'OK', data: count });
        }

        const result = await buildQuery(Task, req).exec();
        const data = Array.isArray(result) ? result : [result];
        return res.status(200).json({ message: 'OK', data });
      } catch (err) {
        return res.status(400).json({ message: err.message, data: [] });
      }
    })

    .post(async (req, res) => {
      try {
        const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body;
        if (!name || !deadline)
          return res.status(400).json({ message: 'Name and deadline are required', data: [] });

        const newTask = new Task({
          name,
          description,
          deadline,
          completed: completed || false,
          assignedUser: assignedUser || '',
          assignedUserName: assignedUserName || 'unassigned'
        });

        const savedTask = await newTask.save();

        // update assigned user's pendingTasks
        if (savedTask.assignedUser && mongoose.Types.ObjectId.isValid(savedTask.assignedUser)) {
          await User.findByIdAndUpdate(
            savedTask.assignedUser,
            { $addToSet: { pendingTasks: savedTask._id.toString() } }
          );
        }

        return res.status(201).json({ message: 'Task created', data: savedTask });
      } catch (err) {
        return res.status(500).json({ message: 'Server error creating task', data: [] });
      }
    });

  router.route('/tasks/:id')
    .get(async (req, res) => {
      try {
        const id = req.params.id.trim();

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ message: 'Invalid task ID format', data: [] });
        }

        let select = null;
        if (req.query.select) {
          try {
            select = JSON.parse(req.query.select);
          } catch {
            return res.status(400).json({ message: 'Invalid JSON in select parameter', data: [] });
          }
        }

        const task = await Task.findById(id, select || undefined);
        if (!task) {
          return res.status(404).json({ message: 'Task not found', data: [] });
        }

        return res.status(200).json({ message: 'OK', data: task });
      } catch (err) {
        console.error('Error in GET /tasks/:id:', err.message);
        return res.status(500).json({ message: 'Server error fetching task', data: err.message });
      }
    })

    .put(async (req, res) => {
      try {
        const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body;
        if (!name || !deadline)
          return res.status(400).json({ message: 'Name and deadline are required', data: [] });

        const task = await Task.findById(req.params.id);
        if (!task)
          return res.status(404).json({ message: 'Task not found', data: [] });

        // remove from old user if reassigned
        if (task.assignedUser && task.assignedUser !== assignedUser) {
          await User.findByIdAndUpdate(task.assignedUser, { $pull: { pendingTasks: task._id.toString() } });
        }

        task.name = name;
        task.description = description;
        task.deadline = deadline;
        task.completed = completed || false;
        task.assignedUser = assignedUser || '';
        task.assignedUserName = assignedUserName || 'unassigned';

        const savedTask = await task.save();

        // add to new user
        if (assignedUser && mongoose.Types.ObjectId.isValid(assignedUser)) {
          await User.findByIdAndUpdate(
            assignedUser,
            { $addToSet: { pendingTasks: savedTask._id.toString() } }
          );
        }

        return res.status(200).json({ message: 'Task updated', data: savedTask });
      } catch (err) {
        return res.status(500).json({ message: 'Server error updating task', data: [] });
      }
    })

    .delete(async (req, res) => {
      try {
        const task = await Task.findById(req.params.id);
        if (!task)
          return res.status(404).json({ message: 'Task not found', data: [] });

        // remove from user's pendingTasks if assigned
        if (task.assignedUser && mongoose.Types.ObjectId.isValid(task.assignedUser)) {
          await User.findByIdAndUpdate(
            task.assignedUser,
            { $pull: { pendingTasks: task._id.toString() } }
          );
        }

        await task.deleteOne();
        return res.status(200).json({ message: 'Task deleted', data: [] });
      } catch (err) {
        return res.status(500).json({ message: 'Server error deleting task', data: [] });
      }
    });

  return router;
};