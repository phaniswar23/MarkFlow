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
  },
  attendance: { type: Number, default: 100 },
  attendanceWeightage: { type: Number, default: 5 },
  midtermApplicable: { type: Boolean, default: false },
  midtermObtained: { type: Number, default: 0 },
  midtermTotal: { type: Number, default: 30 },
  midtermWeightage: { type: Number, default: 20 },
  endSemApplicable: { type: Boolean, default: false },
  endSemObtained: { type: Number, default: 0 },
  endSemTotal: { type: Number, default: 100 },
  endSemWeightage: { type: Number, default: 50 },
  credits: { type: Number, default: 3 },
  includeInCGPA: { type: Boolean, default: true },
  totalClasses: { type: Number, default: 40 },
  attendedClasses: { type: Number, default: 40 }
}, { timestamps: true });

module.exports = mongoose.model('Subject', SubjectSchema);
