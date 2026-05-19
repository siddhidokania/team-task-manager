import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [tab, setTab] = useState('tasks');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '', priority: 'medium', assigned_to: '' });
  const [memberEmail, setMemberEmail] = useState('');

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    try {
      const [pRes, tRes, dRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`),
        api.get(`/dashboard/${id}`)
      ]);
      setProject(pRes.data);
      setTasks(Array.isArray(tRes.data) ? tRes.data : []);
      setDashboard(dRes.data || null);
      setIsAdmin(pRes.data.role === 'admin');
    } catch {
      alert('Failed to load project');
      navigate('/');
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editTask) {
        await api.put(`/tasks/${editTask.id}`, { ...taskForm, project_id: id });
      } else {
        await api.post('/tasks', { ...taskForm, project_id: id });
      }
      setShowTaskModal(false);
      setEditTask(null);
      setTaskForm({ title: '', description: '', due_date: '', priority: 'medium', assigned_to: '' });
      loadAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed to save task'); }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      loadAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed to update status'); }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      loadAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete task'); }
  };

  const addMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      setMemberEmail('');
      setShowMemberModal(false);
      loadAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed to add member'); }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      loadAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed to remove member'); }
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({ title: task.title, description: task.description || '', due_date: task.due_date || '', priority: task.priority, assigned_to: task.assigned_to || '' });
    setShowTaskModal(true);
  };

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);

  if (!project) return <div className="loading">Loading...</div>;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">TaskManager</div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')}>← Back</button>
      </nav>

      <div className="project-detail-header">
        <div>
          <h2>{project.name}</h2>
          <p style={{color:'#666', marginTop:'0.25rem'}}>{project.description}</p>
        </div>
        <div className="header-actions">
          {isAdmin && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}>+ Add Member</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setEditTask(null); setTaskForm({ title:'', description:'', due_date:'', priority:'medium', assigned_to:'' }); setShowTaskModal(true); }}>+ New Task</button>
            </>
          )}
        </div>
      </div>

      <div className="container">
        <div className="tabs">
          <button className={`tab ${tab==='tasks'?'active':''}`} onClick={() => setTab('tasks')}>Tasks</button>
          <button className={`tab ${tab==='dashboard'?'active':''}`} onClick={() => setTab('dashboard')}>Dashboard</button>
          <button className={`tab ${tab==='members'?'active':''}`} onClick={() => setTab('members')}>Members</button>
        </div>

        {tab === 'tasks' && (
          <div className="kanban">
            {[['todo','To Do'],['inprogress','In Progress'],['done','Done']].map(([status, label]) => (
              <div key={status} className="kanban-col">
                <h4>{label} ({tasksByStatus(status).length})</h4>
                {tasksByStatus(status).map(task => (
                  <div key={task.id} className="task-card">
                    <h5>{task.title}</h5>
                    {task.description && <p>{task.description}</p>}
                    <div className="task-meta">
                      <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                      {task.due_date && <span style={{fontSize:'0.75rem',color:'#666'}}>Due: {task.due_date}</span>}
                    </div>
                    {task.assigned_to_name && <p style={{fontSize:'0.78rem',color:'#888',marginTop:'0.4rem'}}>👤 {task.assigned_to_name}</p>}
                    <div style={{marginTop:'0.75rem', display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap'}}>
                      <select className="status-select" value={task.status} onChange={e => updateStatus(task.id, e.target.value)}>
                        <option value="todo">To Do</option>
                        <option value="inprogress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                      {isAdmin && (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditTask(task)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteTask(task.id)}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {tasksByStatus(status).length === 0 && <p style={{color:'#aaa',fontSize:'0.85rem',textAlign:'center',padding:'1rem'}}>No tasks</p>}
              </div>
            ))}
          </div>
        )}

        {tab === 'dashboard' && dashboard && (
          <div>
            <div className="stats-grid">
              <div className="stat-card"><h3>{dashboard.total}</h3><p>Total Tasks</p></div>
              {dashboard.byStatus.map(s => (
                <div key={s.status} className="stat-card">
                  <h3>{s.count}</h3>
                  <p>{s.status === 'inprogress' ? 'In Progress' : s.status.charAt(0).toUpperCase() + s.status.slice(1)}</p>
                </div>
              ))}
              <div className="stat-card"><h3 style={{color:'#ff4757'}}>{dashboard.overdue.length}</h3><p>Overdue</p></div>
            </div>
            {dashboard.overdue.length > 0 && (
              <div className="card">
                <h4 style={{marginBottom:'1rem', color:'#ff4757'}}>Overdue Tasks</h4>
                <div className="overdue-list">
                  {dashboard.overdue.map(t => (
                    <div key={t.id} className="overdue-item"><strong>{t.title}</strong> — Due: {t.due_date}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'members' && (
          <div className="card">
            <h4 style={{marginBottom:'1rem'}}>Project Members</h4>
            <div className="members-list">
              {project.members?.map(m => (
                <div key={m.id} className="member-item">
                  <div>
                    <strong>{m.name}</strong>
                    <span style={{color:'#666', fontSize:'0.85rem', marginLeft:'0.5rem'}}>{m.email}</span>
                  </div>
                  <div style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
                    <span className={`badge badge-${m.role}`}>{m.role}</span>
                    {isAdmin && m.id !== user.id && (
                      <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.id)}>Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editTask ? 'Edit Task' : 'Create Task'}</h3>
            <form onSubmit={handleTaskSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input type="text" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label>Assign To</label>
                <select value={taskForm.assigned_to} onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})}>
                  <option value="">Unassigned</option>
                  {project.members?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editTask ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Member</h3>
            <form onSubmit={addMember}>
              <div className="form-group">
                <label>Member Email</label>
                <input type="email" placeholder="member@example.com" value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}