import React, { useEffect, useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import apiClient from '../services/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/analytics', {
        params: { dateRange },
      });
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="text-sm text-[#4A6080]">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-sm text-[#8BA3B8]">Unable to load analytics data.</div>;
  }

  const { productivity, goals, study, spiritual, review } = analytics;

  // Format data for charts
  const productivityWeeklyData = (productivity?.weeklyData || []).map((item) => ({
    week: new Date(item.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    completed: item.completed,
  }));

  const studySubjectData = (study?.hoursPerSubject || []).map((item) => ({
    name: item.subject,
    value: item.hours,
  }));

  const studyWeeklyData = (study?.sessionsPerWeek || []).map((item) => ({
    week: new Date(item.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sessions: item.sessions,
  }));

  const spiritualWeeklyData = (spiritual?.weeklyData || []).map((item) => ({
    week: new Date(item.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ...item,
  }));

  return (
    <>
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-[#0A1628]">Analytics & Progress</h1>
          <p className="text-sm text-[#4A6080] mt-0.5">Track productivity, goals, studies, and spiritual growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-[#E8F4F8] rounded-lg text-sm focus:outline-none focus:border-[#00B4D8]"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="threeMonths">Last 3 Months</option>
          </select>
          <button
            onClick={handlePrint}
            className="bg-[#0A1628] text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#0D2137] transition-colors"
          >
            <Download size={16} strokeWidth={1.5} />
            Export
          </button>
        </div>
      </div>

      {/* 1. Productivity Overview */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow p-6 border border-gray-100">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Productivity Overview</h2>
            <p className="text-gray-500 mt-1">Tasks completed per week</p>
          </div>
          {productivityWeeklyData.length === 0 ? (
            <p className="text-gray-500">No task data available for the selected period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={productivityWeeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" fill="#7c3aed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Completion Rate</h3>
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-gray-500">Completion rate</p>
              <p className="mt-2 text-4xl font-bold text-purple-600">{productivity?.completionRate || 0}%</p>
              <p className="mt-2 text-sm text-gray-600">{productivity?.totalCompleted || 0} of {productivity?.totalTasks || 0} tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Goal Progress */}
      <div className="bg-white rounded-3xl shadow p-6 border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Goal Progress</h2>
            <p className="text-gray-500 mt-1">Track all active and completed goals</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Goals completed this month</p>
            <p className="text-2xl font-bold text-purple-600">{goals?.completedThisMonth || 0}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(goals?.activeGoals || []).map((goal) => (
            <div key={goal.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{goal.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{goal.category}</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">Progress</span>
                  <span className="text-xs font-semibold text-gray-700">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        {(goals?.activeGoals || []).length === 0 && (
          <p className="text-gray-500">No active goals yet. Create a goal to get started!</p>
        )}
      </div>

      {/* 3. Study Analytics */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="bg-white rounded-3xl shadow p-6 border border-gray-100">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Study Hours by Subject</h2>
            <p className="text-gray-500 mt-1">Total hours invested per subject</p>
          </div>
          {studySubjectData.length === 0 ? (
            <p className="text-gray-500">No study session data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={studySubjectData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}h`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {studySubjectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(2)}h`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow p-6 border border-gray-100">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Study Sessions Per Week</h2>
            <p className="text-gray-500 mt-1">Weekly session count trend</p>
          </div>
          {studyWeeklyData.length === 0 ? (
            <p className="text-gray-500">No study session data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={studyWeeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sessions" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. Spiritual Consistency */}
      <div className="bg-white rounded-3xl shadow p-6 border border-gray-100 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Spiritual Consistency</h2>
          <p className="text-gray-500 mt-1">Completion rate per week for prayer, devotion, and bible study</p>
        </div>
        {spiritualWeeklyData.length === 0 ? (
          <p className="text-gray-500">No spiritual activity data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spiritualWeeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="prayer" fill="#7c3aed" radius={[8, 8, 0, 0]} />
              <Bar dataKey="devotion" fill="#ec4899" radius={[8, 8, 0, 0]} />
              <Bar dataKey="bible" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 5. Weekly Review */}
      <div className="bg-white rounded-3xl shadow p-6 border border-gray-100">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Weekly Review</h2>
          <p className="text-gray-500 mt-1">
            Week of {new Date(review?.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} —{' '}
            {new Date(review?.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Wins */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-600">Wins 🎉</h3>
            <div className="space-y-2">
              {(review?.completedTasks || []).length > 0 ? (
                review.completedTasks.map((task, idx) => (
                  <div key={idx} className="rounded-2xl bg-green-50 p-3 border border-green-200">
                    <p className="text-sm font-medium text-gray-800">✓ {task}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No completed tasks this week yet.</p>
              )}
              {(review?.completedGoals || []).length > 0 &&
                review.completedGoals.map((goal, idx) => (
                  <div key={`goal-${idx}`} className="rounded-2xl bg-green-50 p-3 border border-green-200">
                    <p className="text-sm font-medium text-gray-800">🏆 Goal: {goal}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Challenges & Streaks */}
          <div className="space-y-6">
            {/* Missed items */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-orange-600">Missed Items ⚠️</h3>
              <div className="space-y-2">
                {(review?.missedTasks || []).length > 0 ? (
                  review.missedTasks.slice(0, 3).map((task, idx) => (
                    <div key={idx} className="rounded-2xl bg-orange-50 p-3 border border-orange-200">
                      <p className="text-sm font-medium text-gray-800">• {task}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No missed tasks!</p>
                )}
              </div>
            </div>

            {/* Streaks */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-600">Current Streaks 🔥</h3>
              <div className="space-y-2">
                {(review?.streaks || []).map((streak, idx) => (
                  <div key={idx} className="rounded-2xl bg-blue-50 p-3 border border-blue-200">
                    <p className="text-sm font-medium text-gray-800">
                      {streak.type}: <span className="font-bold text-blue-600">{streak.current_count} days</span>
                    </p>
                  </div>
                ))}
                {(review?.streaks || []).length === 0 && <p className="text-sm text-gray-500">No active streaks yet.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* In Progress */}
        {(review?.inProgressTasks || []).length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-3 text-slate-600">In Progress</h3>
            <div className="space-y-2">
              {review.inProgressTasks.map((task, idx) => (
                <div key={idx} className="rounded-2xl bg-slate-50 p-3 border border-slate-200">
                  <p className="text-sm font-medium text-gray-800">⏳ {task}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
