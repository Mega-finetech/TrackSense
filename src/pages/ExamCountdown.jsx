import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import apiClient from '../services/api';

const calculateCountdown = (examDate) => {
  if (!examDate) return 'No Date';
  const date = new Date(examDate);
  const now = new Date();
  const diff = date - now;
  if (diff <= 0) return 'Completed';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
};

export default function ExamCountdown() {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { register, handleSubmit, reset } = useForm();

  const fetchExams = async () => {
    try {
      const res = await apiClient.get('/exams');
      setExams(res?.data ?? res);
    } catch (err) {
      console.error('Failed to load exams', err);
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
    fetchExams();
    fetchCourses();
    const interval = setInterval(() => {
      setExams((prev) => [...prev]);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const sortedExams = useMemo(() => {
    return [...exams].sort((a, b) => {
      const aDate = a.exam_date ? new Date(a.exam_date) : new Date(9999, 0, 0);
      const bDate = b.exam_date ? new Date(b.exam_date) : new Date(9999, 0, 0);
      return aDate - bDate;
    });
  }, [exams]);

  const openCreate = () => {
    setEditing(null);
    reset({});
    setModalOpen(true);
  };

  const openEdit = (exam) => {
    setEditing(exam);
    reset({
      course_id: exam.course_id || '',
      subject: exam.subject,
      exam_date: exam.exam_date ? exam.exam_date.split('T')[0] : '',
      location: exam.location || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (vals) => {
    try {
      if (editing) {
        await apiClient.put(`/exams/${editing.id}`, vals);
      } else {
        await apiClient.post('/exams', vals);
      }
      setModalOpen(false);
      fetchExams();
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const removeExam = async (id) => {
    if (!confirm('Delete this exam?')) return;
    await apiClient.delete(`/exams/${id}`);
    fetchExams();
  };

  if (loading) return <div className="p-6">Loading exams...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Exam Countdown</h1>
        <button onClick={openCreate} className="px-3 py-1 bg-purple-600 text-white rounded">+ Add Exam</button>
      </div>

      <div className="space-y-3">
        {sortedExams.map((exam) => (
          <div key={exam.id} className="bg-white rounded shadow p-4 flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-lg">{exam.subject}</span>
                {exam.course_name && <span className="text-xs text-gray-500">({exam.course_name})</span>}
              </div>
              <div className="text-sm text-gray-600">
                {exam.exam_date && new Date(exam.exam_date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              {exam.location && <div className="text-xs text-gray-500 mt-1">📍 {exam.location}</div>}
            </div>
            <div className="flex items-center space-x-4 ml-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{calculateCountdown(exam.exam_date)}</div>
                <div className="text-xs text-gray-500">until exam</div>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => openEdit(exam)} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Edit</button>
                <button onClick={() => removeExam(exam.id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Del</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-lg h-full sm:h-auto overflow-y-auto">
            <h3 className="text-lg font-medium mb-3">{editing ? 'Edit Exam' : 'New Exam'}</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Subject</label>
                <input {...register('subject', { required: true })} className="w-full border rounded px-2 py-1" />
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
                <label className="block text-sm font-medium">Exam Date & Time</label>
                <input type="datetime-local" {...register('exam_date')} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Location</label>
                <input {...register('location')} placeholder="e.g., Building A, Room 101" className="w-full border rounded px-2 py-1" />
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
