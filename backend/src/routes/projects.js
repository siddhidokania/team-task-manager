const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Create project
router.post('/', auth, (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name required' });

    const result = db.prepare(
      'INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)'
    ).run(name, description, req.user.id);

    db.prepare(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
    ).run(result.lastInsertRowid, req.user.id, 'admin');

    const project = db.prepare('SELECT * FROM projects WHERE id=?').get(result.lastInsertRowid);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all projects for current user
router.get('/', auth, (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*, pm.role, u.name as creator_name
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      JOIN users u ON p.created_by = u.id
      WHERE pm.user_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single project
router.get('/:id', auth, (req, res) => {
  try {
    const project = db.prepare(`
      SELECT p.*, pm.role FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE p.id=? AND pm.user_id=?
    `).get(req.params.id, req.user.id);

    if (!project)
      return res.status(404).json({ message: 'Project not found or access denied' });

    const members = db.prepare(`
      SELECT u.id, u.name, u.email, pm.role
      FROM project_members pm JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id=?
    `).all(req.params.id);

    res.json({ ...project, members });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add member (admin only)
router.post('/:id/members', auth, (req, res) => {
  try {
    const { email, role = 'member' } = req.body;

    const adminCheck = db.prepare(
      'SELECT role FROM project_members WHERE project_id=? AND user_id=?'
    ).get(req.params.id, req.user.id);

    if (!adminCheck || adminCheck.role !== 'admin')
      return res.status(403).json({ message: 'Only admins can add members' });

    const user = db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    db.prepare(
      'INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
    ).run(req.params.id, user.id, role);

    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove member (admin only)
router.delete('/:id/members/:userId', auth, (req, res) => {
  try {
    const adminCheck = db.prepare(
      'SELECT role FROM project_members WHERE project_id=? AND user_id=?'
    ).get(req.params.id, req.user.id);

    if (!adminCheck || adminCheck.role !== 'admin')
      return res.status(403).json({ message: 'Only admins can remove members' });

    db.prepare(
      'DELETE FROM project_members WHERE project_id=? AND user_id=?'
    ).run(req.params.id, req.params.userId);

    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;