const express = require('express');
const router = express.Router();
const { run_query, get_all, get_one } = require('../db'); const db = { run_query, get_all, get_one };
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, due_date, priority, project_id, assigned_to } = req.body;
    if (!title || !project_id) return res.status(400).json({ message: 'Title and project required' });
    const adminCheck = await db.get_one('SELECT role FROM project_members WHERE project_id=? AND user_id=?', [project_id, req.user.id]);
    if (!adminCheck || adminCheck.role !== 'admin') return res.status(403).json({ message: 'Only admins can create tasks' });
    const result = await db.run_query('INSERT INTO tasks (title, description, due_date, priority, project_id, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)', [title, description, due_date, priority || 'medium', project_id, assigned_to || null, req.user.id]);
    const task = await db.get_one('SELECT * FROM tasks WHERE id=?', [result.id]);
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const memberCheck = await db.get_one('SELECT role FROM project_members WHERE project_id=? AND user_id=?', [req.params.projectId, req.user.id]);
    if (!memberCheck) return res.status(403).json({ message: 'Access denied' });
    const tasks = await db.get_all('SELECT t.*, u.name as assigned_to_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.project_id=? ORDER BY t.created_at DESC', [req.params.projectId]);
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['todo', 'inprogress', 'done'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const task = await db.get_one('SELECT * FROM tasks WHERE id=?', [req.params.id]);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const memberCheck = await db.get_one('SELECT role FROM project_members WHERE project_id=? AND user_id=?', [task.project_id, req.user.id]);
    if (!memberCheck) return res.status(403).json({ message: 'Access denied' });
    if (memberCheck.role !== 'admin' && task.assigned_to !== req.user.id) return res.status(403).json({ message: 'You can only update tasks assigned to you' });
    await db.run_query('UPDATE tasks SET status=? WHERE id=?', [status, req.params.id]);
    const updated = await db.get_one('SELECT * FROM tasks WHERE id=?', [req.params.id]);
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, due_date, priority, assigned_to, status } = req.body;
    const task = await db.get_one('SELECT * FROM tasks WHERE id=?', [req.params.id]);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const adminCheck = await db.get_one('SELECT role FROM project_members WHERE project_id=? AND user_id=?', [task.project_id, req.user.id]);
    if (!adminCheck || adminCheck.role !== 'admin') return res.status(403).json({ message: 'Only admins can edit tasks' });
    await db.run_query('UPDATE tasks SET title=?, description=?, due_date=?, priority=?, assigned_to=?, status=? WHERE id=?', [title, description, due_date, priority, assigned_to || null, status, req.params.id]);
    const updated = await db.get_one('SELECT * FROM tasks WHERE id=?', [req.params.id]);
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await db.get_one('SELECT * FROM tasks WHERE id=?', [req.params.id]);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const adminCheck = await db.get_one('SELECT role FROM project_members WHERE project_id=? AND user_id=?', [task.project_id, req.user.id]);
    if (!adminCheck || adminCheck.role !== 'admin') return res.status(403).json({ message: 'Only admins can delete tasks' });
    await db.run_query('DELETE FROM tasks WHERE id=?', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
