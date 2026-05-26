const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. CA1, CA2
  obtainedMarks: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 30 }
});

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true },
  weightage: { type: Number, required: true, min: 0, max: 100 },
  targetScore: { type: Number, default: 24, min: 0, max: 100 },
  selectionLogic: {
    type: String,
    default: 'all'
  },
  assessments: {
    type: [AssessmentSchema],
    default: [
      { name: 'CA1', obtainedMarks: 0, totalMarks: 30 },
      { name: 'CA2', obtainedMarks: 0, totalMarks: 30 }
    ]
  }
}, { timestamps: true });

module.exports = mongoose.model('Subject', SubjectSchema);
