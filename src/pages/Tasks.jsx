import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import {
  Plus, ListTodo, LayoutGrid, Calendar as CalendarIcon,
  Pencil, Trash2, Repeat, Flag, FolderOpen, Target, CheckCircle2
} from 'lucide-react';
import apiClient from '../services/api';
import Modal from '../components/ui/Modal';
import { Button, Input, Textarea, Select, Field } from '../components/ui';
import { SegmentedControl } from '../components/ui/Controls';
import Badge, { PRIORITY_TONE } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const STATUS_LABELS = {
  todo: 'To Do',
  to_do: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const KANBAN_COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

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

const formatTaskDate = (dueDate) => {
  if (!dueDate) return '—';
  return new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [recurrence, setRecurrence] = useState('none');
  const [weeklyDays, setWeeklyDays] = useState([]);
  const [monthlyDay, setMonthlyDay] = useState('');

  const { register, handleSubmit, reset } = useForm();

  const fetchTasks = async () => {
    try {
      const res = await apiClient.get('/tasks');
      setTasks(res?.data ?? res);
    } catch (err) {
      console.error('Failed to load tasks', err);
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await apiClient.get('/goals');
      setGoals(res?.data ?? res);
    } catch (err) {
      console.error('Failed to load goals', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await apiClient.get('/projects');
      setProjects(res?.data ?? res);
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  useEffect(() => {
    Promise.all([fetchTasks(), fetchGoals(), fetchProjects()]).finally(() => setLoading(false));
  }, []);

  // Recurring tasks and grouped non-recurring tasks for list view
  const recurringTasks = useMemo(() => tasks.filter((t) => t.is_recurring), [tasks]);

  const groupedTasks = useMemo(() => {
    const groups = {
      'Today': [],
      'Tomorrow': [],
      'This Week': [],
      'Later': [],
      'No Date': [],
    };
    tasks.filter((t) => !t.is_recurring).forEach((t) => {
      groups[getTaskDateGroup(t.due_date)].push(t);
    });
    return groups;
  }, [tasks]);

  // Kanban columns
  const kanbanColumns = useMemo(() => ({
    todo: tasks.filter((t) => t.status === 'todo' || t.status === 'to_do'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
  }), [tasks]);

  // Calendar events
  const calendarEvents = useMemo(() => {
    return tasks
      .filter((t) => t.due_date)
      .map((t) => ({
        id: t.id,
        title: `${t.is_recurring ? '🔁 ' : ''}${t.title}`,
        start: new Date(t.due_date),
        end: new Date(t.due_date),
        resource: t,
      }));
  }, [tasks]);

  const openCreate = () => {
    setEditing(null);
    reset({ status: 'todo', priority: 'medium', project_id: '' });
    setRecurrence('none');
    setWeeklyDays([]);
    setMonthlyDay('');
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditing(task);
    reset({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      goal_id: task.goal_id || '',
      project_id: task.project_id || '',
    });
    if (task.is_recurring && task.recur_pattern) {
      setRecurrence(task.recur_pattern.type || 'daily');
      if (task.recur_pattern.type === 'weekly') {
        setWeeklyDays(task.recur_pattern.days || []);
      } else if (task.recur_pattern.type === 'monthly') {
        setMonthlyDay(task.recur_pattern.day?.toString() || '');
      } else {
        setWeeklyDays([]);
        setMonthlyDay('');
      }
    } else {
      setRecurrence('none');
      setWeeklyDays([]);
      setMonthlyDay('');
    }
    setModalOpen(true);
  };

  const onSubmit = async (vals) => {
    try {
      const recurPattern = recurrence === 'none' ? null : recurrence === 'daily'
        ? { type: 'daily' }
        : recurrence === 'weekly'
          ? { type: 'weekly', days: weeklyDays }
          : { type: 'monthly', day: Number(monthlyDay) || new Date().getDate() };

      const payload = {
        ...vals,
        project_id: vals.project_id || null,
        is_recurring: recurrence !== 'none',
        recur_pattern: recurPattern,
      };

      if (editing) {
        await apiClient.put(`/tasks/${editing.id}`, payload);
      } else {
        await apiClient.post('/tasks', payload);
      }
      setModalOpen(false);
      fetchTasks();
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const removeTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    await apiClient.delete(`/tasks/${id}`);
    fetchTasks();
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const taskId = draggableId.split('-')[1];
    const newStatus = destination.droppableId;
    await apiClient.put(`/tasks/${taskId}`, { status: newStatus });
    fetchTasks();
  };

  const selectEvent = (event) => {
    openEdit(event.resource);
  };

  const VIEW_OPTIONS = [
    { value: 'list', icon: ListTodo },
    { value: 'kanban', icon: LayoutGrid },
    { value: 'calendar', icon: CalendarIcon },
  ];

  return (
    <div className="page-enter-fade">
      {/* PAGE HEADER */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Tasks</h1>
          <p className="mt-0.5 text-sm text-ink-mute">Manage your to-do list and track progress.</p>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl options={VIEW_OPTIONS} value={view} onChange={setView} />
          <Button onClick={openCreate} size="md" className="hidden sm:inline-flex">
            <Plus size={15} strokeWidth={2.2} />
            New Task
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : (
        <div>
          {view === 'list' && (
            <div className="space-y-7">
              {recurringTasks.length > 0 && (
                <TaskGroup title="Recurring">
                  {recurringTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      goals={goals}
                      projects={projects}
                      onEdit={openEdit}
                      onDelete={removeTask}
                    />
                  ))}
                </TaskGroup>
              )}
              {Object.entries(groupedTasks).map(([group, groupTasks]) =>
                groupTasks.length > 0 ? (
                  <TaskGroup key={group} title={group}>
                    {groupTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        goals={goals}
                        projects={projects}
                        onEdit={openEdit}
                        onDelete={removeTask}
                      />
                    ))}
                  </TaskGroup>
                ) : null
              )}
            </div>
          )}

          {view === 'kanban' && (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {KANBAN_COLUMNS.map(({ id: status, label }) => (
                  <div key={status} className="rounded-2xl border border-line bg-card-muted/50 p-3">
                    <div className="mb-3 flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft">{label}</h3>
                      <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-bold text-ink-mute shadow-sm">
                        {kanbanColumns[status].length}
                      </span>
                    </div>
                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-40 space-y-2.5 rounded-xl transition-colors ${
                            snapshot.isDraggingOver ? 'bg-cyan-500/[0.07] ring-2 ring-inset ring-cyan-400/30' : ''
                          }`}
                        >
                          {kanbanColumns[status].map((task, idx) => (
                            <Draggable key={task.id} draggableId={`task-${task.id}`} index={idx}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`card-base cursor-grab rounded-xl p-3.5 transition-shadow active:cursor-grabbing ${
                                    snapshot.isDragging ? 'shadow-lift ring-2 ring-cyan-400/40' : ''
                                  } ${task.status === 'done' ? 'opacity-75' : ''}`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="flex items-start gap-1.5 text-sm font-semibold leading-snug text-ink">
                                      {task.is_recurring && <Repeat size={12} className="mt-1 flex-shrink-0 text-emerald-500" />}
                                      {task.title}
                                    </p>
                                    {status === 'done' && <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-emerald-500" />}
                                  </div>
                                  {task.description && (
                                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-mute">{task.description}</p>
                                  )}
                                  {task.project_id && (
                                    <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-card-muted px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">
                                      <FolderOpen size={10} />
                                      {projects.find((p) => p.id === task.project_id)?.title || 'Unknown'}
                                    </p>
                                  )}
                                  <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
                                    <Badge tone={PRIORITY_TONE[task.priority] ?? 'slate'}>
                                      <Flag size={9} strokeWidth={2.5} />
                                      {task.priority}
                                    </Badge>
                                    <span className="text-[11px] font-medium text-ink-mute">{formatTaskDate(task.due_date)}</span>
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
            </DragDropContext>
          )}

          {view === 'calendar' && (
            <div className="card-base p-3" style={{ height: '70vh' }}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectEvent={selectEvent}
              />
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button (mobile) */}
      <button
        onClick={openCreate}
        aria-label="New task"
        className="fab fixed bottom-[calc(var(--bottom-nav-total)+16px)] right-4 z-40 sm:hidden"
      >
        <Plus size={24} strokeWidth={2.2} />
      </button>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Task' : 'New Task'}
        footer={
          <div className="flex justify-end gap-2.5">
            <Button variant="secondary" size="md" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button form="task-form" type="submit" size="md">{editing ? 'Save Changes' : 'Create Task'}</Button>
          </div>
        }
      >
        <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Title">
            <Input {...register('title', { required: true })} placeholder="What needs doing?" />
          </Field>
          <Field label="Description" hint="optional">
            <Textarea {...register('description')} placeholder="Add details…" rows={3} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <Select {...register('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select {...register('status')}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </Select>
            </Field>
          </div>
          <Field label="Due Date">
            <Input type="date" {...register('due_date')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Project">
              <Select {...register('project_id')}>
                <option value="">None</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))}
              </Select>
            </Field>
            <Field label="Linked Goal">
              <Select {...register('goal_id')}>
                <option value="">None</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Repeats">
            <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
              <option value="none">Never</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </Select>
          </Field>
          {recurrence === 'weekly' && (
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Repeat on</span>
              <div className="grid grid-cols-7 gap-1.5">
                {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day) => {
                  const key = day.toLowerCase();
                  const active = weeklyDays.includes(key);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() =>
                        setWeeklyDays((cur) =>
                          cur.includes(key) ? cur.filter((d) => d !== key) : [...cur, key]
                        )
                      }
                      className={`h-10 rounded-lg text-[11px] font-bold transition-all active:scale-90 ${
                        active
                          ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-glow'
                          : 'border border-line bg-card text-ink-soft hover:border-cyan-300'
                      }`}
                    >
                      {day.slice(0, 2)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {recurrence === 'monthly' && (
            <Field label="Day of month" hint="1–28">
              <Input
                type="number"
                min="1"
                max="28"
                value={monthlyDay}
                onChange={(e) => setMonthlyDay(e.target.value)}
                placeholder="e.g. 15"
              />
            </Field>
          )}
        </form>
      </Modal>
    </div>
  );
}

/* ──────────── Sub-components ──────────── */

function TaskGroup({ title, children }) {
  return (
    <section>
      <h2 className="mb-2.5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-ink-mute">
        {title === 'Today' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-500" />}
        {title}
      </h2>
      <div className="card-base divide-y divide-line overflow-hidden">
        {children}
      </div>
    </section>
  );
}

function TaskRow({ task, goals, projects, onEdit, onDelete }) {
  return (
    <div className="list-row group flex items-start gap-3 p-4 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`text-sm font-semibold text-ink ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
            {task.title}
          </span>
          {task.is_recurring && (
            <Badge tone="emerald"><Repeat size={9} strokeWidth={2.5} /> Recurring</Badge>
          )}
          <Badge tone={PRIORITY_TONE[task.priority] ?? 'slate'}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </Badge>
        </div>
        {task.description && (
          <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-ink-mute">{task.description}</p>
        )}
        {(task.goal_id || task.project_id) && (
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] font-medium text-ink-mute">
            {task.goal_id && (
              <span className="inline-flex items-center gap-1">
                <Target size={10} />
                {goals.find((g) => g.id === task.goal_id)?.title || 'Unknown'}
              </span>
            )}
            {task.project_id && (
              <span className="inline-flex items-center gap-1">
                <FolderOpen size={10} />
                {projects.find((p) => p.id === task.project_id)?.title || 'Unknown'}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5 text-right">
        <div>
          <div className="text-xs font-bold text-ink-soft">{formatTaskDate(task.due_date)}</div>
          <div className="text-[10px] text-ink-mute">{STATUS_LABELS[task.status]}</div>
        </div>
        <div className="flex gap-1.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
          <button
            onClick={() => onEdit(task)}
            aria-label="Edit task"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-card-muted text-ink-soft transition-colors hover:bg-accent-soft hover:text-[var(--ts-accent)]"
          >
            <Pencil size={12} strokeWidth={2} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            aria-label="Delete task"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-card-muted text-ink-soft transition-colors hover:bg-rose-500/15 hover:text-rose-500"
          >
            <Trash2 size={12} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
