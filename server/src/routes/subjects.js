const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');

// GET all subjects
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: -1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving subjects', error: err.message });
  }
});

// POST new subject
router.post('/', async (req, res) => {
  const { name, code, weightage, targetScore, selectionLogic, assessments } = req.body;
  
  if (!name || !code || weightage === undefined) {
    return res.status(400).json({ message: 'Subject name, code, and weightage are required' });
  }

  const trimmedName = name.trim();
  const trimmedCode = code.trim();

  try {
    // Strict, case-insensitive, trimmed checks for duplicate name OR code
    const duplicate = await Subject.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${trimmedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } },
        { code: { $regex: new RegExp(`^${trimmedCode.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } }
      ]
    });

    if (duplicate) {
      return res.status(400).json({ message: 'Subject already exists' });
    }

    const newSubject = new Subject({
      name: trimmedName,
      code: trimmedCode,
      weightage,
      targetScore: targetScore === undefined ? 24 : targetScore,
      selectionLogic: selectionLogic || 'all',
      assessments: assessments || [
        { name: 'CA1', obtainedMarks: 0, totalMarks: 30 },
        { name: 'CA2', obtainedMarks: 0, totalMarks: 30 }
      ]
    });
    
    const savedSubject = await newSubject.save();
    res.status(201).json(savedSubject);
  } catch (err) {
    res.status(400).json({ message: 'Error creating subject', error: err.message });
  }
});

// PUT update existing subject
router.put('/:id', async (req, res) => {
  const { name, code, weightage, targetScore, selectionLogic, assessments } = req.body;
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Verify name duplication on edit
    if (name !== undefined) {
      const trimmedName = name.trim();
      const duplicateName = await Subject.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${trimmedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
      });
      if (duplicateName) {
        return res.status(400).json({ message: 'Subject already exists' });
      }
      subject.name = trimmedName;
    }

    // Verify code duplication on edit
    if (code !== undefined) {
      const trimmedCode = code.trim();
      const duplicateCode = await Subject.findOne({
        _id: { $ne: req.params.id },
        code: { $regex: new RegExp(`^${trimmedCode.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
      });
      if (duplicateCode) {
        return res.status(400).json({ message: 'Subject already exists' });
      }
      subject.code = trimmedCode;
    }

    if (weightage !== undefined) subject.weightage = weightage;
    if (targetScore !== undefined) subject.targetScore = targetScore;
    if (selectionLogic !== undefined) subject.selectionLogic = selectionLogic;
    if (assessments !== undefined) subject.assessments = assessments;

    const updatedSubject = await subject.save();
    res.json(updatedSubject);
  } catch (err) {
    res.status(400).json({ message: 'Error updating subject', error: err.message });
  }
});

// DELETE all subjects
router.delete('/', async (req, res) => {
  try {
    await Subject.deleteMany({});
    res.json({ message: 'All subjects deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting all subjects', error: err.message });
  }
});

// DELETE single subject
router.delete('/:id', async (req, res) => {
  try {
    const deletedSubject = await Subject.findByIdAndDelete(req.params.id);
    if (!deletedSubject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.json({ message: 'Subject deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting subject', error: err.message });
  }
});

module.exports = router;
