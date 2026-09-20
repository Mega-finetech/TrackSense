import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Target, Plus, X, CheckCircle2, AlertCircle } from 'lucide-react';
import apiClient from '../services/api';

const CATEGORIES = ['Academic', 'Spiritual', 'Career', 'Health', 'Personal', 'Financial'];
const CATEGORY_COLORS = {
  Academic: 'bg-blue-100 text-blue-700',
  Spiritual: 'bg-purple-100 text-purple-700',
  Career: 'bg-green-100 text-green-700',
  Health: 'bg-red-100 text-red-700',
  Personal: 'bg-yellow-100 text-yellow-700',
  Financial: 'bg-orange-100 text-orange-700',
};

const getGoalStatus = (goal) => {
  if (goal.status === 'completed') return 'completed';
  if (goal.deadline && new Date(goal.deadline) < new Date()) return 'overdue';
  return 'active';
};

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('deadline');

  const { register, handleSubmit, reset } = useForm();

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/goals');
      const data = res?.data ?? res;
      setGoals(data);
    } catch (err) {
      console.error('Failed to load goals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  // Filter goals by category and status
  const filtered = useMemo(() => {
    let result = goals;
    if (selectedCategory !== 'All') {
      result = result.filter((g) => g.category === selectedCategory);
    }
    if (selectedStatus !== 'All') {
      result = result.filter((g) => getGoalStatus(g) === selectedStatus);
    }
    return result;
  }, [goals, selectedCategory, selectedStatus]);

  // Sort filtered goals
  const sorted = useMemo(() => {
    let result = [...filtered];
    if (sortBy === 'deadline') {
      result.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      });
    } else if (sortBy === 'progress') {
      result.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
    } else if (sortBy === 'created') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return result;
  }, [filtered, sortBy]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const active = goals.filter((g) => getGoalStatus(g) === 'active').length;
    const thisMonth = goals.filter((g) => {
      if (g.status !== 'completed' || !g.updated_at) return false;
      const updated = new Date(g.updated_at);
      const now = new Date();
      return updated.getMonth() === now.getMonth() && updated.getFullYear() === now.getFullYear();
    }).length;
    return { active, completed: thisMonth };
  }, [goals]);

  const openCreate = () => { setEditing(null); reset(); setModalOpen(true); };
  const openEdit = (g) => {
    setEditing(g);
    reset({
      title: g.title,
      description: g.description,
      category: g.category,
      deadline: g.deadline ? g.deadline.split('T')[0] : '',
      status: g.status,
    });
    setModalOpen(true);
  };

  const onSubmit = async (vals) => {
    try {
      if (editing) {
        await apiClient.put(`/goals/${editing.id}`, vals);
      } else {
        await apiClient.post('/goals', vals);
      }
      setModalOpen(false);
      fetchGoals();
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const removeGoal = async (id) => {
    if (!confirm('Delete this goal?')) return;
    await apiClient.delete(`/goals/${id}`);
    fetchGoals();
  };

  const addMilestone = async (goalId) => {
    const title = prompt('Milestone title');
    if (!title) return;
    await apiClient.post(`/goals/${goalId}/milestones`, { title });
    fetchGoals();
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return '—';
    const d = new Date(deadline);
    const now = new Date();
    const diff = d - now;
    if (diff < 0) return `${Math.floor(-diff / (1000 * 60 * 60 * 24))} days ago`;
    return `in ${Math.ceil(diff / (1000 * 60 * 60 * 24))} days`;
  };

  return (
    <>
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-[#0A1628]">Goals</h1>
          <p className="text-sm text-[#4A6080] mt-0.5">{summary.active} active · {summary.completed} completed</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#0A1628] text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#0D2137] transition-colors"
        >
          <Plus size={16} strokeWidth={1.5} />
          New Goal
        </button>
      </div>

      {/* FILTER/TAB BAR */}
      <div className="flex items-center gap-1 mb-6 border-b border-[#E8F4F8] pb-0">
        {['All', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              selectedCategory === cat
                ? 'text-[#0A1628] font-medium border-b-2 border-[#00B4D8]'
                : 'text-[#4A6080] border-b-2 border-transparent hover:text-[#0A1628]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? <div>Loading...</div> : (
        <div>
          {sorted.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No goals found</div>
          ) : (
            <div>
              {view === 'list' ? (
                <div className="space-y-3">
                  {sorted.map((g) => (
                    <div key={g.id} className="bg-white rounded shadow p-4 flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{g.title}</span>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${CATEGORY_COLORS[g.category] || 'bg-gray-100'}`}>
                            {g.category}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            getGoalStatus(g) === 'completed' ? 'bg-green-100 text-green-700' :
                            getGoalStatus(g) === 'overdue' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {getGoalStatus(g).charAt(0).toUpperCase() + getGoalStatus(g).slice(1)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">{g.description}</div>
                        <div className="text-xs text-gray-400 mt-1">Due {formatDeadline(g.deadline)}</div>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        <div className="w-48">
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div className="h-2 bg-green-500" style={{ width: `${g.progress ?? 0}%` }} />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{g.progress ?? 0}% • {g.milestoneCount ?? 0} milestones</div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <div className="text-sm text-gray-600">{formatDeadline(g.deadline)}</div>
                          <div className="flex space-x-2">
                            <button onClick={() => addMilestone(g.id)} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">+M</button>
                            <button onClick={() => openEdit(g)} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Edit</button>
                            <button onClick={() => removeGoal(g.id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Del</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sorted.map((g) => (
                    <div key={g.id} className="bg-white rounded shadow p-4 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{g.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded font-medium ${CATEGORY_COLORS[g.category] || 'bg-gray-100'}`}>
                              {g.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">{g.description}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex-1">
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div className="h-2 bg-indigo-600" style={{ width: `${g.progress ?? 0}%` }} />
                        </div>
                        <div className="text-xs text-gray-500 mt-2">{g.progress ?? 0}% complete • {g.milestoneCount ?? 0} milestones</div>
                        <div className="text-xs text-gray-600 mt-2">
                          <span className={`px-2 py-1 rounded font-medium ${
                            getGoalStatus(g) === 'completed' ? 'bg-green-100 text-green-700' :
                            getGoalStatus(g) === 'overdue' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {getGoalStatus(g).charAt(0).toUpperCase() + getGoalStatus(g).slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 text-xs text-gray-500">{formatDeadline(g.deadline)}</div>
                      <div className="flex space-x-2 mt-4">
                        <button onClick={() => addMilestone(g.id)} className="flex-1 px-2 py-1 border rounded text-xs hover:bg-gray-50">+Milestone</button>
                        <button onClick={() => openEdit(g)} className="flex-1 px-2 py-1 border rounded text-xs hover:bg-gray-50">Edit</button>
                        <button onClick={() => removeGoal(g.id)} className="flex-1 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-lg h-full sm:h-auto overflow-y-auto">
            <h3 className="text-lg font-medium mb-3">{editing ? 'Edit Goal' : 'New Goal'}</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input {...register('title', { required: true })} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Category</label>
                <select {...register('category')} className="w-full border rounded px-2 py-1">
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Deadline</label>
                <input type="date" {...register('deadline')} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select {...register('status')} className="w-full border rounded px-2 py-1">
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea {...register('description')} className="w-full border rounded px-2 py-1 h-20" />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1 border rounded hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
