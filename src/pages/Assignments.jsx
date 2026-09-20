import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import apiClient from '../services/api';

const getUrgencyColor = (dueDate) => {
  if (!dueDate) return 'bg-gray-100 text-gray-700';
  const date = new Date(dueDate);
  const now = new Date();
  const diff = date - now;
  if (diff < 0) return 'bg-red-100 text-red-700'; // overdue
  if (diff < 24 * 60 * 60 * 1000) return 'bg-orange-100 text-orange-700'; // today
  return 'bg-green-100 text-green-700'; // upcoming
};

const getUrgencyLabel = (dueDate) => {
  if (!dueDate) return 'No Date';
  const date = new Date(dueDate);
  const now = new Date();
  const diff = date - now;
  if (diff < 0) return 'Overdue';
  if (diff < 24 * 60 * 60 * 1000) return 'Due Today';
  return 'Upcoming';
};

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { register, handleSubmit, reset } = useForm();

  const fetchAssignments = async () => {
    try {
      const res = await apiClient.get('/assignments');
      setAssignments(res?.data ?? res);
    } catch (err) {
      console.error('Failed to load assignments', err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await apiClient.get('/courses');
      setCourses(res?.data ?? res);
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
  }, []);

  const sortedAssignments = useMemo(() => {
    return [...assignments].sort((a, b) => {
      const aDate = a.due_date ? new Date(a.due_date) : new Date(9999, 0, 0);
      const bDate = b.due_date ? new Date(b.due_date) : new Date(9999, 0, 0);
      return aDate - bDate;
    });
  }, [assignments]);

  const openCreate = () => {
    setEditing(null);
    reset({ status: 'pending' });
    setModalOpen(true);
  };

  const openEdit = (assignment) => {
    setEditing(assignment);
    reset({
      course_id: assignment.course_id || '',
      title: assignment.title,
      due_date: assignment.due_date ? assignment.due_date.split('T')[0] : '',
      weight: assignment.weight || '',
      grade: assignment.grade || '',
      status: assignment.status,
    });
    setModalOpen(true);
  };

  const onSubmit = async (vals) => {
    try {
      if (editing) {
        await apiClient.put(`/assignments/${editing.id}`, vals);
      } else {
        await apiClient.post('/assignments', vals);
      }
      setModalOpen(false);
      fetchAssignments();
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const removeAssignment = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    await apiClient.delete(`/assignments/${id}`);
    fetchAssignments();
  };

  if (loading) return <div className="p-6">Loading assignments...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Assignments</h1>
        <button onClick={openCreate} className="px-3 py-1 bg-purple-600 text-white rounded">+ Add Assignment</button>
      </div>

      <div className="space-y-3">
        {sortedAssignments.map((assignment) => (
          <div key={assignment.id} className="bg-white rounded shadow p-4 flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium">{assignment.title}</span>
                <span className={`text-xs px-2 py-1 rounded font-medium ${getUrgencyColor(assignment.due_date)}`}>
                  {getUrgencyLabel(assignment.due_date)}
                </span>
              </div>
              {assignment.course_name && <p className="text-sm text-gray-600">{assignment.course_name}</p>}
              <div className="text-xs text-gray-400 mt-1">
                {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                {assignment.weight && ` • Weight: ${assignment.weight}%`}
              </div>
            </div>
            <div className="flex items-center space-x-3 ml-4">
              {assignment.grade && <div className="text-sm font-medium text-gray-700">Grade: {assignment.grade}</div>}
              <div className="flex space-x-2">
                <button onClick={() => openEdit(assignment)} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Edit</button>
                <button onClick={() => removeAssignment(assignment.id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Del</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-lg h-full sm:h-auto overflow-y-auto">
            <h3 className="text-lg font-medium mb-3">{editing ? 'Edit Assignment' : 'New Assignment'}</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input {...register('title', { required: true })} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Course</label>
                <select {...register('course_id')} className="w-full border rounded px-2 py-1">
                  <option value="">No course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Due Date</label>
                <input type="date" {...register('due_date')} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium">Weight %</label>
                  <input type="number" {...register('weight')} className="w-full border rounded px-2 py-1" min="0" max="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Grade</label>
                  <input type="number" {...register('grade')} className="w-full border rounded px-2 py-1" min="0" max="100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select {...register('status')} className="w-full border rounded px-2 py-1">
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="graded">Graded</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1 border rounded hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
