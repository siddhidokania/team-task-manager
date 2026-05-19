const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/:projectId', auth, (req, res) => {
  try {
    const { projectId } = req.params;
    const memberCheck = db.prepare('SELECT role FROM project_members WHERE project_id=? AND user_id=?').get(projectId, req.user.id);
    if (!memberCheck) return res.status(403).json({ message: 'Access denied' });
    const total = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE project_id=?').get(projectId);
    const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM tasks WHERE project_id=? GROUP BY status').all(projectId);
    const byUser = db.prepare('SELECT u.name, COUNT(t.id) as count FROM tasks t JOIN users u ON t.assigned_to = u.id WHERE t.project_id=? GROUP BY u.name').all(projectId);
    const overdue = db.prepare("SELECT * FROM tasks WHERE project_id=? AND due_date < date('now') AND status != 'done'").all(projectId);
    res.json({ total: total.count, byStatus, byUser, overdue });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
