import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['todo', 'inprogress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '', priority: 'medium', assigned_to: '' });
  const [filter, setFilter] = useState('all');

  const isAdmin = project?.role === 'admin';

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      const [proj, taskRes, statsRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`),
        api.get(`/dashboard/${id}`)
      ]);
      setProject(proj.data);
      setTasks(taskRes.data);
      setStats(statsRes.data);
    } catch { navigate('/dashboard'); }
  };

  const createTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', { ...taskForm, project_id: parseInt(id) });
      setTaskForm({ title: '', description: '', due_date: '', priority: 'medium', assigned_to: '' });
      setShowTaskForm(false);
      fetchAll();
    } catch (err) { alert(err.response?.data?.message); }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      fetchAll();
    } catch (err) { alert(err.response?.data?.message); }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchAll();
    } catch (err) { alert(err.response?.data?.message); }
  };

  const addMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      setMemberEmail('');
      setShowMemberForm(false);
      fetchAll();
    } catch (err) { alert(err.response?.data?.message); }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      fetchAll();
    } catch (err) { alert(err.response?.data?.message); }
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  if (!project) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <nav className="navbar">
        <button onClick={() => navigate('/dashboard')} className="btn-secondary">← Back</button>
        <h1>{project.name}</h1>
        <span className={`badge ${project.role}`}>{project.role}</span>
      </nav>

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card"><span className="stat-num">{stats.total}</span><span>Total Tasks</span></div>
          <div className="stat-card"><span className="stat-num">{stats.byStatus.find(s => s.status === 'todo')?.count || 0}</span><span>To Do</span></div>
          <div className="stat-card"><span className="stat-num">{stats.byStatus.find(s => s.status === 'inprogress')?.count || 0}</span><span>In Progress</span></div>
          <div className="stat-card"><span className="stat-num">{stats.byStatus.find(s => s.status === 'done')?.count || 0}</span><span>Done</span></div>
          <div className="stat-card overdue"><span className="stat-num">{stats.overdue.length}</span><span>Overdue</span></div>
        </div>
      )}

      {/* Members */}
      <div className="card">
        <div className="section-header">
          <h3>Members</h3>
          {isAdmin && <button onClick={() => setShowMemberForm(!showMemberForm)} className="btn-primary">+ Add Member</button>}
        </div>
        {showMemberForm && (
          <form onSubmit={addMember} className="inline-form">
            <input placeholder="Member email" value={memberEmail}
              onChange={e => setMemberEmail(e.target.value)} required />
            <button type="submit" className="btn-primary">Add</button>
            <button type="button" onClick={() => setShowMemberForm(false)} className="btn-secondary">Cancel</button>
          </form>
        )}
        <div className="members-list">
          {project.members?.map(m => (
            <div key={m.id} className="member-item">
              <span>{m.name} — {m.email}</span>
              <span className={`badge ${m.role}`}>{m.role}</span>
              {isAdmin && m.id !== user.id && (
                <button onClick={() => removeMember(m.id)} className="btn-danger">Remove</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div className="section-header" style={{ marginTop: '1.5rem' }}>
        <h3>Tasks</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {isAdmin && <button onClick={() => setShowTaskForm(!showTaskForm)} className="btn-primary">+ New Task</button>}
        </div>
      </div>

      {showTaskForm && isAdmin && (
        <div className="card form-card">
          <form onSubmit={createTask}>
            <input placeholder="Task title" value={taskForm.title}
              onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
            <input placeholder="Description" value={taskForm.description}
              onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
            <input type="date" value={taskForm.due_date}
              onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
            <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}>
              <option value="">Unassigned</option>
              {project.members?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Create Task</button>
              <button type="button" onClick={() => setShowTaskForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="tasks-board">
        {STATUSES.map(status => (
          <div key={status} className="task-column">
            <h4 className={`column-header ${status}`}>
              {status === 'todo' ? 'To Do' : status === 'inprogress' ? 'In Progress' : 'Done'}
            </h4>
            {filteredTasks.filter(t => t.status === status).map(task => (
              <div key={task.id} className={`task-card priority-${task.priority}`}>
                <div className="task-top">
                  <strong>{task.title}</strong>
                  <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                </div>
                {task.description && <p>{task.description}</p>}
                {task.assigned_to_name && <small>👤 {task.assigned_to_name}</small>}
                {task.due_date && <small>📅 {new Date(task.due_date).toLocaleDateString()}</small>}
                <div className="task-actions">
                  <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {isAdmin && <button onClick={() => deleteTask(task.id)} className="btn-danger">Delete</button>}
                </div>
              </div>
            ))}
            {filteredTasks.filter(t => t.status === status).length === 0 && (
              <p className="empty-col">No tasks</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}