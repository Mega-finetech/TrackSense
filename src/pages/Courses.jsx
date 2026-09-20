import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import apiClient from '../services/api';

const STATUS_COLORS = {
  planned: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  dropped: 'bg-red-100 text-red-700',
};

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { register, handleSubmit, reset } = useForm();

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/courses');
      setCourses(res?.data ?? res);
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ status: 'active', credits: 3 });
    setModalOpen(true);
  };

  const openEdit = (course) => {
    setEditing(course);
    reset({ name: course.name, code: course.code, credits: course.credits, status: course.status });
    setModalOpen(true);
  };

  const onSubmit = async (vals) => {
    try {
      if (editing) {
        await apiClient.put(`/courses/${editing.id}`, vals);
      } else {
        await apiClient.post('/courses', vals);
      }
      setModalOpen(false);
      fetchCourses();
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const removeCourse = async (id) => {
    if (!confirm('Delete this course?')) return;
    await apiClient.delete(`/courses/${id}`);
    fetchCourses();
  };

  if (loading) return <div className="p-6">Loading courses...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Courses</h1>
        <button onClick={openCreate} className="px-3 py-1 bg-purple-600 text-white rounded">+ Add Course</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg">{course.name}</h3>
                {course.code && <p className="text-xs text-gray-500">{course.code}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_COLORS[course.status]}`}>
                {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-4">{course.credits} credits</div>
            <div className="flex space-x-2">
              <button onClick={() => openEdit(course)} className="flex-1 text-xs px-2 py-1 border rounded hover:bg-gray-50">Edit</button>
              <button onClick={() => removeCourse(course.id)} className="flex-1 text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-lg h-full sm:h-auto overflow-y-auto">
            <h3 className="text-lg font-medium mb-3">{editing ? 'Edit Course' : 'New Course'}</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input {...register('name', { required: true })} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Code</label>
                <input {...register('code')} placeholder="e.g., CS101" className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Credits</label>
                <input type="number" {...register('credits')} className="w-full border rounded px-2 py-1" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select {...register('status')} className="w-full border rounded px-2 py-1">
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="dropped">Dropped</option>
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
