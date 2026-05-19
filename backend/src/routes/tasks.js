const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.post('/', auth, (req, res) => {
  try {
    const { title, description, due_date, priority, project_id, assigned_to } = req.body;
    if (!title || !project_id) return res.status(400).json({ message: 'Title and project required' });
    const adminCheck = db.prepare('SELECT role FROM project_members WHERE project_id=? AND user_id=?').get(project_id, req.user.id);
    if (!adminCheck || adminCheck.role !== 'admin') return res.status(403).json({ message: 'Only admins can create tasks' });
    const result = db.prepare('INSERT INTO tasks (title, description, due_date, priority, project_id, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)').run(title, description, due_date, priority || 'medium', project_id, assigned_to, req.user.id);
    const task = db.prepare('SELECT * FROM tasks WHERE id=?').get(result.lastInsertRowid);
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/project/:projectId', auth, (req, res) => {
  try {
    const memberCheck = db.prepare('SELECT role FROM project_members WHERE project_id=? AND user_id=?').get(req.params.projectId, req.user.id);
    if (!memberCheck) return res.status(403).json({ message: 'Access denied' });
    const tasks = db.prepare('SELECT t.*, u.name as assigned_to_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.project_id=? ORDER BY t.created_at DESC').all(req.params.projectId);
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id/status', auth, (req, res) => {
  try {
    const { status } = req.body;
    if (!['todo', 'inprogress', 'done'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const task = db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const memberCheck = db.prepare('SELECT role FROM project_members WHERE project_id=? AND user_id=?').get(task.project_id, req.user.id);
    if (!memberCheck) return res.status(403).json({ message: 'Access denied' });
    if (memberCheck.role !== 'admin' && task.assigned_to !== req.user.id) return res.status(403).json({ message: 'You can only update tasks assigned to you' });
    db.prepare('UPDATE tasks SET status=? WHERE id=?').run(status, req.params.id);
    res.json(db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, (req, res) => {
  try {
    const { title, description, due_date, priority, assigned_to, status } = req.body;
    const task = db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const adminCheck = db.prepare('SELECT role FROM project_members WHERE project_id=? AND user_id=?').get(task.project_id, req.user.id);
    if (!adminCheck || adminCheck.role !== 'admin') return res.status(403).json({ message: 'Only admins can edit tasks' });
    db.prepare('UPDATE tasks SET title=?, description=?, due_date=?, priority=?, assigned_to=?, status=? WHERE id=?').run(title, description, due_date, priority, assigned_to, status, req.params.id);
    res.json(db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const adminCheck = db.prepare('SELECT role FROM project_members WHERE project_id=? AND user_id=?').get(task.project_id, req.user.id);
    if (!adminCheck || adminCheck.role !== 'admin') return res.status(403).json({ message: 'Only admins can delete tasks' });
    db.prepare('DELETE FROM tasks WHERE id=?').run(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
