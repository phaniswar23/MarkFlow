const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: ['bug_report', 'suggestion', 'marks_issue', 'ui_issue'],
    required: [true, 'Feedback type is required']
  },
  message: {
    type: String,
    required: [true, 'Feedback message is required'],
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
