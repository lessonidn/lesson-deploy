/**
BIMBEL Admin Dashboard (single-file starter)
- React + Tailwind UI
- Single-file component exported as default React component for quick preview.

Instructions:
1. Place this file at: /admin/src/AdminDashboard.jsx (or .tsx if you add types)
2. Ensure your admin app is a Vite React project with Tailwind configured.
3. Install deps: npm i @supabase/supabase-js react-router-dom
4. Set env vars in Vercel or .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
5. Run with `npm run dev` (Vite)

This file contains:
- Supabase client
- Auth (email magic link)
- Routes: /admin (dashboard), /admin/login
- CRUD for categories, subcategories, materials, questions, choices
- Inline forms for create/edit, toggle is_correct for choices
- Minimal styling with Tailwind

Note: This is a starter: for production, split into files, add form validation,
use react-query for caching, and secure service-role operations server-side.
*/

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

// Supabase client
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------ Utility hooks ------------------
function useAuth() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const session = supabase.auth.getSession();
    // getSession returns a promise; handle by checking auth state change instead
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    // try to fetch current user
    supabase.auth.getUser().then(res => setUser(res.data?.user ?? null));
    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);
  return { user, supabase };
}

// ------------------ Generic CRUD hooks ------------------
async function fetchTable(table, select = '*', orderBy = null) {
  let query = supabase.from(table).select(select);
  if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.asc });
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function insertRow(table, payload) {
  const { data, error } = await supabase.from(table).insert([payload]).select();
  if (error) throw error;
  return data?.[0];
}

async function updateRow(table, id, payload) {
  const { data, error } = await supabase.from(table).update(payload).eq('id', id).select();
  if (error) throw error;
  return data?.[0];
}

async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ------------------ Admin Components ------------------
function Login() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // check if already logged in
    supabase.auth.getUser().then(res => {
      if (res?.data?.user) navigate('/admin');
    });
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setMsg('Sending magic link...');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setMsg('Error: ' + error.message);
    else setMsg('Magic link sent — check your email.');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            placeholder="email@domain.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
          <button className="w-full bg-indigo-600 text-white py-2 rounded">Send Magic Link</button>
        </form>
        <p className="text-sm mt-3 text-gray-600">{msg}</p>
      </div>
    </div>
  );
}

function TopNav({ user }) {
  return (
    <div className="bg-white shadow p-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Link to="/admin" className="font-bold text-lg">BIMBEL Admin</Link>
        <Link to="/admin/categories" className="text-sm text-gray-600">Categories</Link>
        <Link to="/admin/materials" className="text-sm text-gray-600">Materials</Link>
        <Link to="/admin/questions" className="text-sm text-gray-600">Questions</Link>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <div className="text-sm text-gray-700">{user.email}</div>
        ) : (
          <Link to="/admin/login" className="text-sm text-indigo-600">Login</Link>
        )}
      </div>
    </div>
  );
}

// Reusable CRUD list + form component for simple tables
function CrudList({ title, table, fields, relations=null }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  async function load() {
    setLoading(true);
    try {
      // select relations if provided
      let select = '*';
      if (relations) {
        // relations is an array like [{name:'subcategories', select:'*'}]
        const relStr = relations.map(r => `${r.name}(${r.select || '*'})`).join(',');
        select = `*,${relStr}`;
      }
      const data = await fetchTable(table, select, { column: 'created_at', asc: false });
      setItems(data);
    } catch (err) {
      console.error(err);
      alert('Load error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startCreate() {
    setEditing(null);
    setForm({});
  }
  function startEdit(item) {
    setEditing(item.id);
    setForm(item);
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (editing) {
        await updateRow(table, editing, form);
      } else {
        await insertRow(table, form);
      }
      setForm({});
      setEditing(null);
      await load();
    } catch (err) {
      alert('Save error: ' + err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this item?')) return;
    try {
      await deleteRow(table, id);
      await load();
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  }

  return (
    <div className="p-6 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div>
          <button onClick={startCreate} className="px-3 py-1 bg-green-600 text-white rounded">New</button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-2 mb-4">
        {fields.map(f => (
          <div key={f.key} className="flex gap-2">
            <label className="w-28 text-sm pt-2">{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})} className="flex-1 border p-2 rounded" />
            ) : f.type === 'select' ? (
              <select value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})} className="border p-2 rounded">
                <option value="">-- select --</option>
                {(f.options || []).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            ) : (
              <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})} className="flex-1 border p-2 rounded" />
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <button type="submit" className="px-3 py-1 bg-indigo-600 text-white rounded">Save</button>
          <button type="button" onClick={() => { setForm({}); setEditing(null); }} className="px-3 py-1 border rounded">Cancel</button>
        </div>
      </form>

      {loading ? <div>Loading...</div> : (
        <div className="space-y-2">
          {items.map(it => (
            <div key={it.id} className="p-3 border rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{it.name || it.title || it.text}</div>
                {relations && relations.length > 0 && relations.map(r => (
                  <div className="text-sm text-gray-500" key={r.name}>{r.name}: {JSON.stringify(it[r.name])}</div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(it)} className="px-2 py-1 border rounded">Edit</button>
                <button onClick={() => handleDelete(it.id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Special CRUD for Questions + Choices (with is_correct toggle)
function QuestionsManager() {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qform, setQform] = useState({});
  const [editingQ, setEditingQ] = useState(null);

  async function loadMaterials() {
    const data = await fetchTable('materials', '*', { column: 'created_at', asc: false });
    setMaterials(data || []);
  }
  async function loadQuestions(materialId) {
    if (!materialId) return setQuestions([]);
    // fetch questions with choices relation
    const { data, error } = await supabase.from('questions').select('*, choices(id, text, is_correct)').eq('material_id', materialId).order('order', { ascending: true });
    if (error) return alert('Load questions error: ' + error.message);
    setQuestions(data || []);
  }

  useEffect(() => { loadMaterials(); }, []);
  useEffect(() => { if (selectedMaterial) loadQuestions(selectedMaterial); }, [selectedMaterial]);

  async function createQuestion(e) {
    e.preventDefault();
    try {
      const q = await insertRow('questions', { material_id: selectedMaterial, text: qform.text, order: qform.order || 0, points: qform.points || 1 });
      setQform({});
      await loadQuestions(selectedMaterial);
    } catch (err) { alert(err.message); }
  }

  async function deleteQuestion(id) {
    if (!confirm('Delete question?')) return;
    try { await deleteRow('questions', id); await loadQuestions(selectedMaterial); } catch (err) { alert(err.message); }
  }

  async function addChoice(questionId) {
    const text = prompt('Choice text:');
    if (!text) return;
    try { await insertRow('choices', { question_id: questionId, text, is_correct: false }); await loadQuestions(selectedMaterial); } catch (err) { alert(err.message); }
  }

  async function toggleIsCorrect(choiceId, current) {
    try {
      await updateRow('choices', choiceId, { is_correct: !current });
      await loadQuestions(selectedMaterial);
    } catch (err) { alert(err.message); }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white rounded shadow">
        <h3 className="font-semibold mb-2">Select Material</h3>
        <select className="border p-2 rounded w-full" value={selectedMaterial || ''} onChange={e => setSelectedMaterial(e.target.value)}>
          <option value="">-- choose material --</option>
          {materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
      </div>

      {selectedMaterial && (
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold mb-2">Create Question</h3>
          <form onSubmit={createQuestion} className="space-y-2">
            <input className="w-full border p-2 rounded" placeholder="Question text" value={qform.text||''} onChange={e=>setQform({...qform, text:e.target.value})} required />
            <div className="flex gap-2">
              <input className="border p-2 rounded" placeholder="order" value={qform.order||''} onChange={e=>setQform({...qform, order: e.target.value})} />
              <input className="border p-2 rounded" placeholder="points" value={qform.points||''} onChange={e=>setQform({...qform, points: e.target.value})} />
            </div>
            <div>
              <button className="px-3 py-1 bg-indigo-600 text-white rounded">Add Question</button>
            </div>
          </form>
        </div>
      )}

      <div>
        {questions.map(q => (
          <div key={q.id} className="p-4 bg-white rounded shadow mb-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{q.text}</div>
                <div className="text-sm text-gray-500">points: {q.points} • order: {q.order}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>addChoice(q.id)} className="px-2 py-1 border rounded">Add Choice</button>
                <button onClick={()=>deleteQuestion(q.id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
              </div>
            </div>

            <div className="mt-3">
              <h4 className="text-sm font-semibold">Choices</h4>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {q.choices.map(c => (
                  <div key={c.id} className="flex justify-between items-center border p-2 rounded">
                    <div>
                      <div>{c.text}</div>
                      <div className="text-xs text-gray-500">id: {c.id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Correct</label>
                      <input type="checkbox" checked={c.is_correct} onChange={()=>toggleIsCorrect(c.id, c.is_correct)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------ Main Admin App ------------------
export default function AdminApp() {
  const { user } = useAuth();

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <TopNav user={user} />
        <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
          <Routes>
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={(
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="p-6 bg-white rounded shadow">
                    <h2 className="text-xl font-semibold">Welcome to BIMBEL Admin</h2>
                    <p className="text-sm text-gray-600">Use the navigation links to manage categories, materials, questions, and choices.</p>
                    <div className="mt-4">
                      {user ? <button onClick={signOut} className="px-3 py-1 bg-red-600 text-white rounded">Sign Out</button> : <Link to="/admin/login" className="text-indigo-600">Login</Link>}
                    </div>
                  </div>

                  <div className="mt-4">
                    <CrudList title="Categories" table="categories" fields={[{key:'name', label:'Name'}, {key:'slug', label:'Slug'}]} />
                  </div>
                </div>

                <div>
                  <CrudList title="Materials" table="materials" fields={[{key:'title', label:'Title'}, {key:'description', label:'Description', type:'textarea'}, {key:'category_id', label:'Category', type:'select', options: []}]} relations={[]} />
                </div>
              </div>
            )} />

            <Route path="/admin/categories" element={<CrudList title="Categories" table="categories" fields={[{key:'name', label:'Name'}, {key:'slug', label:'Slug'}]} />} />
            <Route path="/admin/materials" element={<CrudList title="Materials" table="materials" fields={[{key:'title', label:'Title'}, {key:'description', label:'Description', type:'textarea'}, {key:'category_id', label:'Category', type:'select'}]} />} />
            <Route path="/admin/questions" element={<QuestionsManager />} />

          </Routes>
        </div>
      </div>
    </Router>
  );
}
