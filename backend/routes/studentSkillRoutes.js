const express = require('express');
// mergeParams allows access to :userId defined on the parent router
const router = express.Router({ mergeParams: true });
const studentSkillController = require('../controllers/studentSkillController');

/**
 * @route   GET /api/students/:userId/skills
 * @desc    Get all skills for a student
 * @access  Public
 */
router.get('/', studentSkillController.getStudentSkills);

/**
 * @route   POST /api/students/:userId/skills
 * @desc    Add a skill to a student
 * @access  Public
 */
router.post('/', studentSkillController.addStudentSkill);

/**
 * @route   DELETE /api/students/:userId/skills/:skillId
 * @desc    Delete a skill from a student
 * @access  Public
 */
router.delete('/:skillId', studentSkillController.deleteStudentSkill);

module.exports = router;
