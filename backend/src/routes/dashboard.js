const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const memberCheck = await db.get_one('SELECT role FROM project_members WHERE project_id=? AND user_id=?', [projectId, req.user.id]);
    if (!memberCheck) return res.status(403).json({ message: 'Access denied' });
    const total = await db.get_one('SELECT COUNT(*) as count FROM tasks WHERE project_id=?', [projectId]);
    const byStatus = await db.get_all('SELECT status, COUNT(*) as count FROM tasks WHERE project_id=? GROUP BY status', [projectId]);
    const byUser = await db.get_all('SELECT u.name, COUNT(t.id) as count FROM tasks t JOIN users u ON t.assigned_to = u.id WHERE t.project_id=? GROUP BY u.name', [projectId]);
    const overdue = await db.get_all("SELECT * FROM tasks WHERE project_id=? AND due_date < date('now') AND status != 'done'", [projectId]);
    res.json({ total: total.count, byStatus, byUser, overdue });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
