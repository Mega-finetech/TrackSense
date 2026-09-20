import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Folder, Plus, X, ChevronRight } from 'lucide-react';
import apiClient from '../services/api';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const STATUS_LABELS = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
};

const STATUS_CLASSES = {
  planning: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-purple-100 text-purple-700',
};

const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
  urgent: 'bg-red-600 text-white',
};

const STATUS_TEXT = {
  todo: 'To Do',
  to_do: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const getTaskDateGroup = (dueDate) => {
  if (!dueDate) return 'No Date';
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  date.setHours(0, 0, 0, 0);
  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
  if (date < weekEnd) return 'This Week';
  return 'Later';
};

export default function Projects() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [projectForm, setProjectForm] = useState({ title: '', description: '', status: 'planning', deadline: '', notes: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '' });
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projectId) {
      loadProjectDetails(projectId);
    } else {
      setProject(null);
      setTasks([]);
      setMilestones([]);
    }
  }, [projectId]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/projects');
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetails = async (id) => {
    setLoading(true);
    try {
      const [projectData, projectTasks, projectMilestones] = await Promise.all([
        apiClient.get(`/projects/${id}`),
        apiClient.get(`/projects/${id}/tasks`),
        apiClient.get(`/projects/${id}/milestones`),
      ]);
      setProject(projectData);
      setTasks(projectTasks);
      setMilestones(projectMilestones);
      setView('kanban');
    } catch (err) {
      console.error('Failed to load project details', err);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (field, value) => {
    setProjectForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTaskChange = (field, value) => {
    setTaskForm((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateProject = () => {
    setEditingProject(null);
    setProjectForm({ title: '', description: '', status: 'planning', deadline: '', notes: '' });
    setProjectModalOpen(true);
  };

  const openEditProject = (projectToEdit) => {
    setEditingProject(projectToEdit);
    setProjectForm({
      title: projectToEdit.title,
      description: projectToEdit.description || '',
      status: projectToEdit.status,
      deadline: projectToEdit.deadline ? projectToEdit.deadline.split('T')[0] : '',
      notes: projectToEdit.notes || '',
    });
    setProjectModalOpen(true);
  };

  const saveProject = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await apiClient.put(`/projects/${editingProject.id}`, projectForm);
      } else {
        await apiClient.post('/projects', projectForm);
      }
      setProjectModalOpen(false);
      loadProjects();
    } catch (err) {
      console.error('Failed to save project', err);
    }
  };

  const removeProject = async (id) => {
    if (!confirm('Delete this project?')) return;
    try {
      await apiClient.delete(`/projects/${id}`);
      if (project?.id === id) {
        navigate('/projects');
      }
      loadProjects();
    } catch (err) {
      console.error('Failed to delete project', err);
    }
  };

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '' });
    setTaskModalOpen(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
    });
    setTaskModalOpen(true);
  };

  const saveTask = async (e) => {
    e.preventDefault();
    if (!project) return;
    try {
      const payload = {
        ...taskForm,
        project_id: project.id,
      };
      if (editingTask) {
        await apiClient.put(`/tasks/${editingTask.id}`, payload);
      } else {
        await apiClient.post('/tasks', payload);
      }
      setTaskModalOpen(false);
      loadProjectDetails(project.id);
    } catch (err) {
      console.error('Failed to save task', err);
    }
  };

  const removeTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await apiClient.delete(`/tasks/${id}`);
      loadProjectDetails(project.id);
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const addMilestone = async (e) => {
    e.preventDefault();
    if (!project || !milestoneTitle.trim()) return;
    try {
      await apiClient.post(`/projects/${project.id}/milestones`, {
        title: milestoneTitle,
        due_date: milestoneDate || null,
      });
      setMilestoneTitle('');
      setMilestoneDate('');
      loadProjectDetails(project.id);
    } catch (err) {
      console.error('Failed to add milestone', err);
    }
  };

  const toggleMilestone = async (milestoneId) => {
    try {
      await apiClient.patch(`/projects/milestones/${milestoneId}/toggle`);
      loadProjectDetails(project.id);
    } catch (err) {
      console.error('Failed to update milestone', err);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const taskId = draggableId.split('-')[1];
    try {
      await apiClient.put(`/tasks/${taskId}`, { status: destination.droppableId });
      loadProjectDetails(project.id);
    } catch (err) {
      console.error('Failed to move task', err);
    }
  };

  const recurringTasks = useMemo(() => tasks.filter((t) => t.is_recurring), [tasks]);

  const groupedTasks = useMemo(() => {
    const groups = {
      Today: [],
      Tomorrow: [],
      'This Week': [],
      Later: [],
      'No Date': [],
    };
    tasks.filter((t) => !t.is_recurring).forEach((t) => {
      groups[getTaskDateGroup(t.due_date)].push(t);
    });
    return groups;
  }, [tasks]);

  const kanbanColumns = useMemo(
    () => ({
      todo: tasks.filter((t) => t.status === 'todo' || t.status === 'to_do'),
      in_progress: tasks.filter((t) => t.status === 'in_progress'),
      done: tasks.filter((t) => t.status === 'done'),
    }),
    [tasks]
  );

  const calendarEvents = useMemo(
    () =>
      tasks
        .filter((t) => t.due_date)
        .map((t) => ({
          id: t.id,
          title: t.title,
          start: new Date(t.due_date),
          end: new Date(t.due_date),
          resource: t,
        })),
    [tasks]
  );

  const projectSummary = useMemo(() => {
    if (!project) return null;
    return {
      progress: project.progress ?? 0,
      taskCount: project.taskCount ?? 0,
      milestoneCount: milestones.length,
      completedMilestones: milestones.filter((m) => m.completed).length,
    };
  }, [project, milestones]);

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Projects</h1>
          <p className="text-gray-600 mt-1">Manage your initiatives, task boards and milestones in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openCreateProject}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            New Project
          </button>
          {project && (
            <button
              onClick={() => openEditProject(project)}
              className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
            >
              Edit Project
            </button>
          )}
        </div>
      </div>

      {loading && <div>Loading...</div>}

      {!projectId && !loading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((projectItem) => (
            <div key={projectItem.id} className="bg-white rounded-3xl shadow p-6 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{projectItem.title}</h2>
                  <p className="text-gray-500 mt-1 line-clamp-2">{projectItem.description || 'No description yet.'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${STATUS_CLASSES[projectItem.status] || 'bg-gray-100 text-gray-700'}`}>
                  {STATUS_LABELS[projectItem.status]}
                </span>
              </div>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{projectItem.taskCount ?? 0} tasks</span>
                  <span>{projectItem.progress ?? 0}% complete</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-purple-600" style={{ width: `${projectItem.progress ?? 0}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Milestones {projectItem.milestoneCount ?? 0}</span>
                  <span>{projectItem.deadline ? formatDate(projectItem.deadline) : 'No deadline'}</span>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-2">
                <Link
                  to={`/projects/${projectItem.id}`}
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  Open project
                </Link>
                <button
                  onClick={() => removeProject(projectItem.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full bg-white rounded-3xl shadow p-6 border border-gray-100 text-gray-600">
              No projects yet. Create one to start planning your work.
            </div>
          )}
        </div>
      )}

      {projectId && project && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow p-6 border border-gray-100">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">{project.title}</h2>
                <p className="text-gray-600 mt-2">{project.description || 'No project description yet.'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm ${STATUS_CLASSES[project.status]}`}>
                  {STATUS_LABELS[project.status]}
                </span>
                <button
                  onClick={() => navigate('/projects')}
                  className="px-3 py-1 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200"
                >
                  Back to list
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-gray-500">Progress</p>
                <p className="text-2xl font-semibold mt-2">{projectSummary?.progress}%</p>
                <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-purple-600" style={{ width: `${projectSummary?.progress ?? 0}%` }} />
                </div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-gray-500">Tasks</p>
                <p className="text-2xl font-semibold mt-2">{projectSummary?.taskCount}</p>
                <p className="text-sm text-gray-500 mt-2">{projectSummary?.completedMilestones} completed milestones</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-gray-500">Deadline</p>
                <p className="text-2xl font-semibold mt-2">{formatDate(project.deadline)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-5 gap-3">
                  <div>
                    <h3 className="text-xl font-semibold">Task board</h3>
                    <p className="text-gray-500 mt-1">Manage tasks inside this project.</p>
                  </div>
                  <div className="flex items-center gap-2 border rounded-lg bg-gray-100 p-1">
                    {['list', 'kanban', 'calendar'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setView(option)}
                        className={`px-3 py-1 text-sm rounded ${view === option ? 'bg-white shadow text-black' : 'text-gray-600 hover:text-black'}`}
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {view === 'list' && (
                  <div className="space-y-6">
                    {recurringTasks.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold">Recurring Tasks</h4>
                        </div>
                        <div className="space-y-3">
                          {recurringTasks.map((task) => (
                            <div key={task.id} className="bg-gray-50 rounded-3xl p-4 border border-gray-100">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-semibold">{task.title}</p>
                                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Recurring</span>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-500">
                                <span>{STATUS_TEXT[task.status]}</span>
                                <span>{formatDate(task.due_date)}</span>
                              </div>
                              <div className="mt-3 flex gap-2">
                                <button onClick={() => openEditTask(task)} className="px-3 py-1 rounded-lg border text-sm">Edit</button>
                                <button onClick={() => removeTask(task.id)} className="px-3 py-1 rounded-lg bg-red-600 text-white text-sm">Delete</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {Object.entries(groupedTasks).map(([group, groupTasks]) => (
                      groupTasks.length > 0 && (
                        <div key={group}>
                          <h4 className="text-lg font-semibold mb-3">{group}</h4>
                          <div className="space-y-3">
                            {groupTasks.map((task) => (
                              <div key={task.id} className="bg-gray-50 rounded-3xl p-4 border border-gray-100">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="font-semibold">{task.title}</p>
                                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                                  </div>
                                  <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">{STATUS_TEXT[task.status]}</span>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-500">
                                  <span>{formatDate(task.due_date)}</span>
                                  <span className={`${PRIORITY_COLORS[task.priority]} rounded-full px-2 py-1`}>{task.priority}</span>
                                </div>
                                <div className="mt-3 flex gap-2">
                                  <button onClick={() => openEditTask(task)} className="px-3 py-1 rounded-lg border text-sm">Edit</button>
                                  <button onClick={() => removeTask(task.id)} className="px-3 py-1 rounded-lg bg-red-600 text-white text-sm">Delete</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}

                {view === 'kanban' && (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <div className="overflow-x-auto -mx-4 px-4">
                      <div className="grid grid-flow-col auto-cols-[minmax(18rem,1fr)] gap-4 min-w-[90vw] lg:min-w-full">
                        {['todo', 'in_progress', 'done'].map((statusKey) => (
                          <div key={statusKey} className="bg-gray-50 rounded-3xl p-4 min-h-96 min-w-[18rem]">
                            <h4 className="text-lg font-semibold mb-3">{STATUS_TEXT[statusKey]}</h4>
                            <Droppable droppableId={statusKey}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`space-y-3 min-h-72 ${snapshot.isDraggingOver ? 'bg-blue-50 rounded-3xl' : ''}`}
                              >
                                {kanbanColumns[statusKey].map((task, idx) => (
                                  <Draggable key={task.id} draggableId={`task-${task.id}`} index={idx}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`bg-white rounded-3xl p-4 shadow-sm hover:shadow-md ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                      >
                                        <div className="font-semibold">{task.title}</div>
                                        <p className="text-sm text-gray-500 mt-2">{task.description}</p>
                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                          <span className={`${PRIORITY_COLORS[task.priority]} rounded-full px-2 py-1`}>{task.priority}</span>
                                          <span>{formatDate(task.due_date)}</span>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                          <button onClick={() => openEditTask(task)} className="flex-1 px-3 py-2 rounded-lg border text-sm">Edit</button>
                                          <button onClick={() => removeTask(task.id)} className="flex-1 px-3 py-2 rounded-lg bg-red-600 text-white text-sm">Delete</button>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      ))}
                    </div>
                  </div>
                  </DragDropContext>
                )}

                {view === 'calendar' && (
                  <div className="bg-white rounded-3xl shadow p-4 border border-gray-100 h-128">
                    <Calendar
                      localizer={localizer}
                      events={calendarEvents}
                      startAccessor="start"
                      endAccessor="end"
                      style={{ height: '100%' }}
                    />
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={openCreateTask}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">Project Notes</h3>
                    <p className="text-gray-500 mt-1">Add a quick summary or reminders for the team.</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line">{project.notes || 'No notes yet. Use the project editor to add team notes.'}</p>
              </div>

              <div className="bg-white rounded-3xl shadow p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">Milestone Timeline</h3>
                    <p className="text-gray-500 mt-1">Track important checkpoints and mark them complete.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {milestones.length === 0 && (
                    <div className="text-sm text-gray-500">No milestones added yet.</div>
                  )}
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="rounded-3xl border border-gray-100 p-4 bg-slate-50">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{milestone.title}</p>
                          <p className="text-sm text-gray-500 mt-1">Due {formatDate(milestone.due_date)}</p>
                        </div>
                        <button
                          onClick={() => toggleMilestone(milestone.id)}
                          className={`rounded-full px-4 py-2 text-sm ${milestone.completed ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                          {milestone.completed ? 'Completed' : 'Mark Done'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={addMilestone} className="mt-6 space-y-3">
                  <div>
                    <label className="block text-sm font-medium">Milestone Title</label>
                    <input
                      value={milestoneTitle}
                      onChange={(e) => setMilestoneTitle(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Example: Launch beta"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Due Date</label>
                    <input
                      type="date"
                      value={milestoneDate}
                      onChange={(e) => setMilestoneDate(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    Add Milestone
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {projectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-lg h-full sm:h-auto overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">{editingProject ? 'Edit Project' : 'New Project'}</h3>
            <form onSubmit={saveProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input
                  value={projectForm.title}
                  onChange={(e) => handleProjectChange('title', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => handleProjectChange('description', e.target.value)}
                  className="w-full border rounded px-3 py-2 h-24"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium">Status</label>
                  <select
                    value={projectForm.status}
                    onChange={(e) => handleProjectChange('status', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Deadline</label>
                  <input
                    type="date"
                    value={projectForm.deadline}
                    onChange={(e) => handleProjectChange('deadline', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Notes</label>
                  <input
                    value={projectForm.notes}
                    onChange={(e) => handleProjectChange('notes', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                <button type="button" onClick={() => setProjectModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-100">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {taskModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-lg h-full sm:h-auto overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">{editingTask ? 'Edit Task' : 'New Task'}</h3>
            <form onSubmit={saveTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input
                  value={taskForm.title}
                  onChange={(e) => handleTaskChange('title', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => handleTaskChange('description', e.target.value)}
                  className="w-full border rounded px-3 py-2 h-24"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => handleTaskChange('priority', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => handleTaskChange('status', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => handleTaskChange('due_date', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                <button type="button" onClick={() => setTaskModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-100">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
