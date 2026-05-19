import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data)).catch(() => alert('Failed to load projects'));
  }, []);

  const createProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/projects', form);
      setProjects([res.data, ...projects]);
      setShowModal(false);
      setForm({ name: '', description: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create project');
    } finally { setLoading(false); }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">TaskManager</div>
        <div className="navbar-user">
          <span>Hello, {user?.name}</span>
          <button className="btn btn-secondary btn-sm" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="container">
        <div className="page-header">
          <h2>My Projects</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
        </div>

        {projects.length === 0 ? (
          <div className="card" style={{textAlign:'center', padding:'3rem', color:'#666'}}>
            <p>No projects yet. Create your first project!</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(p => (
              <div key={p.id} className="card project-card" onClick={() => navigate(`/projects/${p.id}`)}>
                <h3>{p.name}</h3>
                <p>{p.description || 'No description'}</p>
                <span className={`badge badge-${p.role}`}>{p.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Create New Project</h3>
            <form onSubmit={createProject}>
              <div className="form-group">
                <label>Project Name</label>
                <input type="text" placeholder="e.g. Website Redesign" value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <input type="text" placeholder="What is this project about?" value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
