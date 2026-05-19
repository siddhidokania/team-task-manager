const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name required' });

    const result = await db.run_query(
      'INSERT INTO projects (name, description, created_by) VALUES (?,?,?)',
      [name, description, req.user.id]
    );
    await db.run_query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?,?,?)',
      [result.id, req.user.id, 'admin']
    );
    const project = await db.get_one('SELECT * FROM projects WHERE id=?', [result.id]);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const projects = await db.get_all(
      `SELECT p.*, pm.role, u.name as creator_name
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       JOIN users u ON p.created_by = u.id
       WHERE pm.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const project = await db.get_one(
      `SELECT p.*, pm.role FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE p.id=? AND pm.user_id=?`,
      [req.params.id, req.user.id]
    );
    if (!project) return res.status(404).json({ message: 'Project not found or access denied' });

    const members = await db.get_all(
      `SELECT u.id, u.name, u.email, pm.role
       FROM project_members pm JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id=?`,
      [req.params.id]
    );
    res.json({ ...project, members });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/members', auth, async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    const adminCheck = await db.get_one(
      'SELECT role FROM project_members WHERE project_id=? AND user_id=?',
      [req.params.id, req.user.id]
    );
    if (!adminCheck || adminCheck.role !== 'admin')
      return res.status(403).json({ message: 'Only admins can add members' });

    const user = await db.get_one('SELECT id FROM users WHERE email=?', [email]);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await db.run_query(
      'INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?,?,?)',
      [req.params.id, user.id, role]
    );
    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const adminCheck = await db.get_one(
      'SELECT role FROM project_members WHERE project_id=? AND user_id=?',
      [req.params.id, req.user.id]
    );
    if (!adminCheck || adminCheck.role !== 'admin')
      return res.status(403).json({ message: 'Only admins can remove members' });

    await db.run_query(
      'DELETE FROM project_members WHERE project_id=? AND user_id=?',
      [req.params.id, req.params.userId]
    );
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;