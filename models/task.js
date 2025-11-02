// models/task.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  name: { type: String, required: true },                  // task name
  description: { type: String },                           // details about the task
  deadline: { type: Date, required: true },                // due date
  completed: { type: Boolean, default: false },            // completion status

  assignedUser: { type: String, default: '' },             // user _id (as string)
  assignedUserName: { type: String, default: 'unassigned' },

  dateCreated: { type: Date, default: Date.now }           // timestamp
});

module.exports = mongoose.model('Task', TaskSchema);