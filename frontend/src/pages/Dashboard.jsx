import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) { console.error(err); }
  };

  const createProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      setNewProject({ name: '', description: '' });
      setShowForm(false);
      fetchProjects();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="container">
      <nav className="navbar">
        <h1>Task Manager</h1>
        <div>
          <span>Hello, {user?.name}</span>
          <button onClick={logout} className="btn-secondary">Logout</button>
        </div>
      </nav>

      <div className="page-header">
        <h2>My Projects</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + New Project
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <form onSubmit={createProject}>
            <input placeholder="Project name" value={newProject.name}
              onChange={e => setNewProject({ ...newProject, name: e.target.value })} required />
            <input placeholder="Description (optional)" value={newProject.description}
              onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
            <div className="form-actions">
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="projects-grid">
        {projects.length === 0 && <p className="empty">No projects yet. Create one!</p>}
        {projects.map(p => (
          <div key={p.id} className="card project-card" onClick={() => navigate(`/project/${p.id}`)}>
            <div className="project-header">
              <h3>{p.name}</h3>
              <span className={`badge ${p.role}`}>{p.role}</span>
            </div>
            <p>{p.description || 'No description'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}