import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://notes-app-backend-gold-tau.vercel.app";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchNotes();
      // Assume user is stored or fetch from token, but for simplicity, login sets it
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("token", res.data.token);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
  };

  const fetchNotes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/notes`);
      setNotes(res.data);
    } catch (err) {
      setError("Failed to fetch notes");
    }
  };

  const createNote = async (title, content) => {
    try {
      const res = await axios.post(`${API_BASE}/notes`, { title, content });
      setNotes([...notes, res.data]);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create note");
    }
  };

  const deleteNote = async (id) => {
    try {
      await axios.delete(`${API_BASE}/notes/${id}`);
      setNotes(notes.filter((n) => n._id !== id));
    } catch (err) {
      setError("Failed to delete note");
    }
  };

  const upgrade = async () => {
    try {
      await axios.post(`${API_BASE}/tenants/${user.tenant.slug}/upgrade`);
      setUser({ ...user, tenant: { ...user.tenant, plan: "pro" } });
      setError("");
    } catch (err) {
      setError("Failed to upgrade");
    }
  };

  if (!token) {
    return <Login onLogin={login} error={error} />;
  }

  return (
    <div className="app">
      <header>
        <h1>
          Notes App - {user.tenant.name} ({user.tenant.plan})
        </h1>
        <button onClick={logout}>Logout</button>
      </header>
      {error && <p className="error">{error}</p>}
      <Notes
        notes={notes}
        onCreate={createNote}
        onDelete={deleteNote}
        user={user}
        onUpgrade={upgrade}
      />
    </div>
  );
}

function Login({ onLogin, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="login">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <div className="demo-accounts">
        <h3>Demo Accounts</h3>
        <p>Use these to explore the app:</p>
        <ul>
          <li>
            <strong>Acme Admin:</strong> admin@acme.test / password
          </li>
          <li>
            <strong>Acme Member:</strong> user@acme.test / password
          </li>
          <li>
            <strong>Globex Admin:</strong> admin@globex.test / password
          </li>
          <li>
            <strong>Globex Member:</strong> user@globex.test / password
          </li>
        </ul>
      </div>
    </div>
  );
}

function Notes({ notes, onCreate, onDelete, user, onUpgrade }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(title, content);
    setTitle("");
    setContent("");
  };

  const canCreate = user.tenant.plan === "pro" || notes.length < 3;

  return (
    <div className="notes">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button type="submit" disabled={!canCreate}>
          Create Note
        </button>
      </form>
      {!canCreate && user.role === "admin" && <button onClick={onUpgrade}>Upgrade to Pro</button>}
      <ul>
        {notes.map((note) => (
          <li key={note._id}>
            <h3>{note.title}</h3>
            <p>{note.content}</p>
            <button onClick={() => onDelete(note._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
