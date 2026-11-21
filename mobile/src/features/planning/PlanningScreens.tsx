import ProjectsListView, { ProjectCreateSheet } from '../projects/ProjectsListView';
import GoalsListView from './GoalsListView';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Href, router, Stack, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, Folder, Plus, Target } from 'lucide-react-native';
import { Button, Card, Empty, Field, Label, Loading, Notice, Progress, Screen } from '../../components/ui';
import { AppHeader, CategoryIcon, FidelityPanel, FilterBar, GoalCard, IconButton, IntentEmpty, ProgressRing, SectionHeader } from '../../components/ui/core';
import { BottomNavigation } from '../../components/BottomNavigation';
import { radius, space, type } from '../../theme/tokens';
import { FidelityTheme, useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { queryClient } from '../../services/query';
import { errorMessage } from '../../services/errors';
import { useTasks, useUpdateTask } from '../tasks/queries';
import { TaskRow } from '../tasks/TaskRow';

type Kind = 'goals' | 'projects';
type Plan = { id: string; title: string; description?: string; category?: string; status: string; deadline?: string; notes?: string; progress?: number; taskCount?: number; completedTaskCount?: number; milestoneCount?: number };
type Milestone = { id: string; title: string; completed: boolean | number; due_date?: string };
const config = {
  goals: { title: 'Goals', singular: 'goal', statuses: ['active', 'paused', 'completed', 'overdue'], filters: ['Active', 'Completed', 'All'] },
  projects: { title: 'Projects', singular: 'project', statuses: ['planning', 'active', 'on_hold', 'completed'], filters: ['All', 'Active', 'Completed'] },
};
const pretty = (value: string) => value.replace('_', ' ').replace(/^./, char => char.toUpperCase());
const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline';
function dateValue(value: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error('Enter a valid date as YYYY-MM-DD.');
  return new Date(`${value}T23:59:00`).toISOString();
}
async function refresh(kind: Kind) {
  await Promise.all([kind, 'dashboard', 'tasks'].map(key => queryClient.invalidateQueries({ queryKey: [key] })));
}
function usePlan<T>(kind: Kind, suffix = '') {
  const user = useAuthStore(state => state.user?.id);
  return useQuery({ queryKey: [kind, user, suffix], enabled: !!user, queryFn: () => api.get<unknown, T>(`/${kind}${suffix}`) });
}
function Tabs({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  const { colors } = useTheme();
  return <View style={{ flexDirection: 'row', borderRadius: 24, padding: 4, backgroundColor: colors.raised }}>{options.map(option => <Pressable key={option} accessibilityRole="tab" accessibilityState={{ selected: value === option }} onPress={() => onChange(option)} style={{ flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: value === option ? colors.primary : 'transparent' }}><Label size={12} style={{ color: value === option ? colors.onPrimary : colors.muted }}>{option}</Label></Pressable>)}</View>;
}
function Header({ title, add }: { title: string; add?: () => void }) {
  const { colors } = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>{add && <Pressable accessibilityRole="button" accessibilityLabel="Back to home" onPress={() => router.replace('/')} style={{ width: 44, height: 44, justifyContent: 'center' }}><ArrowLeft size={20} color={colors.text} /></Pressable>}<Label size={20} style={{ fontWeight: '700' }}>{title}</Label>{add && <Pressable accessibilityRole="button" accessibilityLabel={`Add ${title === 'Goals' ? 'goal' : 'project'}`} onPress={add} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}><Plus size={22} color={colors.onPrimary} /></Pressable>}</View>;
}

function ModuleNavigation() { return <BottomNavigation />; }

export function PlanningList({ kind }: { kind: Kind }) {
  return kind === 'goals' ? <View style={{ flex: 1 }}><FidelityTheme><PlanningListContent kind={kind} /></FidelityTheme><BottomNavigation /></View> : <PlanningListContent kind={kind} />;
}
function PlanningListContent({ kind }: { kind: Kind }) {
  const cfg = config[kind]; const { colors } = useTheme();
  const [filter, setFilter] = useState(cfg.filters[0]);
  const query = usePlan<Plan[]>(kind);
  const records = query.data?.filter(item => filter === 'All' || (filter === 'Completed' ? item.status === 'completed' : ['active', 'in_progress'].includes(item.status))) ?? [];
  const add = () => router.push(`/${cfg.singular}/new` as Href);
  const Icon = kind === 'goals' ? Target : Folder;
  if (kind === 'goals') return <><Stack.Screen options={{ headerShown: false }} /><GoalsListView records={records} filter={filter} onFilter={setFilter} loading={query.isPending} error={query.isError ? errorMessage(query.error) : undefined} onRetry={() => query.refetch()} onAdd={add} onBack={() => router.replace('/')} onOpen={id => router.push({ pathname: '/goal/detail', params: { goalId: id } })} /></>;
  return <View style={{ flex: 1 }}><Stack.Screen options={{ headerShown: false }} /><ProjectsListView records={records} allRecords={query.data || []} filter={filter} onFilter={setFilter} loading={query.isPending} error={query.isError ? errorMessage(query.error) : undefined} onRetry={() => query.refetch()} onAdd={add} onBack={() => router.replace('/')} onOpen={id => router.push({ pathname: '/project/detail', params: { projectId: id } })} /><ModuleNavigation /></View>;
}

export function PlanningEditor({ kind }: { kind: Kind }) {
  const cfg = config[kind]; const params = useLocalSearchParams<{ goalId?: string; projectId?: string }>();
  const id = kind === 'goals' ? params.goalId : params.projectId;
  const query = usePlan<Plan[]>(kind);
  if (id && query.isPending) return <Screen><Loading /></Screen>;
  if (id && query.isError) return <Screen><Notice message={errorMessage(query.error)} retry={() => query.refetch()} /></Screen>;
  const record = query.data?.find(item => item.id === id);
  if (id && !record) return <Screen><Notice message="This record is no longer available." /></Screen>;
  return <PlanForm key={id || 'new'} kind={kind} record={record} />;
}
function PlanForm({ kind, record }: { kind: Kind; record?: Plan }) {
  const cfg = config[kind];
  const [title, setTitle] = useState(record?.title || ''); const [description, setDescription] = useState(record?.description || '');
  const [category, setCategory] = useState(record?.category || 'Personal'); const [status, setStatus] = useState(record?.status || (kind === 'projects' ? 'active' : cfg.statuses[0]));
  const [deadline, setDeadline] = useState(record?.deadline?.slice(0, 10) || ''); const [error, setError] = useState('');
  const mutation = useMutation({ mutationFn: async () => {
    if (!title.trim() || title.trim().length > 500) throw new Error('Give this a title of 1–500 characters.');
    if (description.length > 4000) throw new Error('Keep the description under 4,000 characters.');
    const body = { title: title.trim(), description, status, deadline: dateValue(deadline), ...(kind === 'goals' ? { category } : {}) };
    return record ? api.put(`/${kind}/${record.id}`, body) : api.post(`/${kind}`, body);
  }, onSuccess: async () => { await refresh(kind); router.back(); } });
  if (kind === 'projects' && !record) return <ProjectCreateSheet title={title} description={description} deadline={deadline} status={status} onTitle={setTitle} onDescription={setDescription} onDeadline={setDeadline} onStatus={setStatus} onSubmit={() => mutation.mutate()} onCancel={() => router.back()} loading={mutation.isPending} error={mutation.isError ? errorMessage(mutation.error) : undefined} />;
  return <Screen><Header title={`${record ? 'Edit' : 'Create'} ${cfg.singular}`} />
    <Field label="Title" placeholder={kind === 'goals' ? 'Become a better developer' : 'My next project'} value={title} onChangeText={setTitle} maxLength={500} />
    <Field label="Description (optional)" multiline value={description} onChangeText={setDescription} maxLength={4000} />
    {kind === 'goals' && <><Label size={14}>Category</Label><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['Academic', 'Career', 'Financial', 'Personal', 'Spiritual', 'Health', 'Project', 'Skill Development'].map(option => <Button key={option} title={option} secondary={category !== option} onPress={() => setCategory(option)} />)}</View></>}
    <Label size={14}>Status</Label><Tabs options={cfg.statuses.map(pretty)} value={pretty(status)} onChange={value => setStatus(cfg.statuses.find(item => pretty(item) === value)!)} />
    <Field label="Target date (optional)" placeholder="YYYY-MM-DD" value={deadline} onChangeText={value => { setDeadline(value); setError(''); }} autoCapitalize="none" error={error} />
    {mutation.isError && <Notice message={mutation.error instanceof Error ? mutation.error.message : errorMessage(mutation.error)} />}
    <Button title={`Save ${cfg.singular}`} loading={mutation.isPending} onPress={() => mutation.mutate()} /><Button secondary title="Cancel" disabled={mutation.isPending} onPress={() => router.back()} />
  </Screen>;
}

export function PlanningDetail({ kind }: { kind: Kind }) {
  return kind === 'goals' ? <FidelityTheme><PlanningDetailContent kind={kind} /></FidelityTheme> : <PlanningDetailContent kind={kind} />;
}
function PlanningDetailContent({ kind }: { kind: Kind }) {
  const cfg = config[kind]; const { colors } = useTheme();
  const params = useLocalSearchParams<{ goalId?: string; projectId?: string }>();
  const id = kind === 'goals' ? params.goalId : params.projectId;
  const query = usePlan<Plan>(kind, `/${id}`); const milestones = usePlan<Milestone[]>(kind, `/${id}/milestones`);
  const tasks = useTasks(); const updateTask = useUpdateTask();
  const linkedTasks = tasks.data?.filter(task => (kind === 'goals' ? task.goal_id : task.project_id) === id) ?? [];
  const [title, setTitle] = useState(''); const [confirm, setConfirm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const DetailPanel = kind === 'goals' ? FidelityPanel : Card;
  const add = useMutation({ mutationFn: () => api.post(`/${kind}/${id}/milestones`, { title: title.trim() }), onSuccess: async () => { setTitle(''); await refresh(kind); } });
  const toggle = useMutation({ mutationFn: (milestone: Milestone) => api.patch(`/${kind}/milestones/${milestone.id}/toggle`), onSuccess: () => refresh(kind) });
  const remove = useMutation({ mutationFn: () => api.delete(`/${kind}/${id}`), onSuccess: async () => { await refresh(kind); router.replace(`/${kind}` as Href); } });
  if (query.isPending) return <Screen><Loading /></Screen>;
  if (query.isError || !query.data) return <Screen><Notice message={errorMessage(query.error)} retry={() => query.refetch()} /></Screen>;
  const record = query.data;
  const edit = () => router.push({ pathname: `/${cfg.singular}/edit`, params: { [`${cfg.singular}Id`]: id } } as Href);
  return <Screen>{kind === 'goals' ? <>
    <Stack.Screen options={{ headerShown: false }} /><AppHeader title="Goal details" onBack={() => router.canGoBack() ? router.back() : router.replace('/goals')} action={<Pressable accessibilityRole="button" accessibilityLabel="Edit goal" onPress={edit} style={{ minHeight: 44, justifyContent: 'center' }}><Label size={type.label} style={{ fontWeight: '600', color: colors.primary }}>Edit goal</Label></Pressable>} />
    <View style={{ gap: space.md }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}><CategoryIcon category={record.category} /><Label muted size={type.caption}>{record.category || 'Personal'}</Label><View style={{ flex: 1 }} /><View style={{ backgroundColor: colors.soft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill }}><Label size={type.micro} style={{ color: colors.primary }}>{pretty(record.status)}</Label></View></View><Label accessibilityRole="header" size={24} style={{ fontWeight: '600', letterSpacing: -0.6, lineHeight: 31 }}>{record.title}</Label>{!!record.description && <Label muted size={type.label}>{record.description}</Label>}</View>
    <FidelityPanel elevated><View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xl }}><ProgressRing value={record.progress || 0} size={104}><Label size={27} style={{ fontWeight: '700' }}>{record.progress || 0}%</Label><Label muted size={10}>complete</Label></ProgressRing><View style={{ flex: 1, gap: 7 }}><Label size={type.section} style={{ fontWeight: '600' }}>Your progress</Label><Label muted size={type.caption}>{milestones.data ? `${milestones.data.filter(item => item.completed).length} of ${milestones.data.length} milestones complete` : 'Based on milestones'}</Label><Label muted size={type.caption}>{record.deadline ? `Target \u00b7 ${dateLabel(record.deadline)}` : 'No deadline set'}</Label></View></View></FidelityPanel>
  </> : <><Header title="Project" /><Card><Label size={22} style={{ fontWeight: '700' }}>{record.title}</Label><Label muted>{pretty(record.status)}</Label>{!!record.description && <Label>{record.description}</Label>}<Progress value={record.progress || 0} /><Label muted size={12}>{record.progress || 0}% - Based on linked tasks</Label><Label muted size={12}>{dateLabel(record.deadline)}</Label></Card><Button secondary title="Edit project" onPress={edit} /></>}
    <SectionHeader title="Milestones" detail={kind === 'goals' ? "Each small step brings you closer." : undefined} />
    {milestones.isPending ? <Loading /> : milestones.isError ? <Notice message={errorMessage(milestones.error)} retry={() => milestones.refetch()} /> : milestones.data?.length ? <DetailPanel style={kind === 'goals' ? { gap: 0, paddingVertical: 6 } : undefined}>{milestones.data.map((item, index) => <Pressable key={item.id} accessibilityRole="checkbox" accessibilityLabel={item.title} accessibilityState={{ checked: !!item.completed, disabled: toggle.isPending }} aria-checked={!!item.completed} disabled={toggle.isPending} onPress={() => toggle.mutate(item)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: kind === 'goals' ? 56 : 48, paddingVertical: kind === 'goals' ? 10 : 0, borderBottomWidth: kind === 'goals' && index < milestones.data.length - 1 ? 1 : 0, borderBottomColor: colors.border }}><View style={{ width: 24, height: 24, borderWidth: 1, borderColor: colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: item.completed ? colors.primary : 'transparent' }}>{!!item.completed && <Check size={16} color={colors.onPrimary} />}</View><Label style={{ flex: 1, fontSize: kind === 'goals' ? 14 : 15, color: kind === 'goals' && item.completed ? colors.secondary : colors.text, textDecorationLine: item.completed && kind !== 'goals' ? 'line-through' : 'none' }}>{item.title}</Label></Pressable>)}</DetailPanel> : kind === 'goals' ? <IntentEmpty title="One step at a time" detail="Break your goal into a few achievable milestones." /> : <Empty title="One step at a time" detail="Add milestones to break this down into achievable steps." />}
    {kind !== 'goals' || showMilestoneForm ? <><Field label="New milestone" placeholder="Your next step" value={title} onChangeText={setTitle} maxLength={500} /><Button title="Add milestone" disabled={!title.trim()} loading={add.isPending} onPress={() => add.mutate()} /></> : <Button secondary title="New milestone" icon={<Plus size={18} color={colors.primary} />} onPress={() => setShowMilestoneForm(true)} /> }
    {[add, toggle, remove].filter(mutation => mutation.isError).map((mutation, index) => <Notice key={index} message={errorMessage(mutation.error)} />)}
    <SectionHeader title="Linked tasks" detail={kind === 'goals' ? "Turn your intention into action." : undefined} />
    {tasks.isPending ? <Loading /> : tasks.isError ? <Notice message={errorMessage(tasks.error)} retry={() => tasks.refetch()} /> : linkedTasks.length ? <DetailPanel>{linkedTasks.map(task => <TaskRow key={task.id} task={task} busy={updateTask.isPending} onToggle={() => updateTask.mutate({ id: task.id, status: task.status === 'done' ? 'todo' : 'done' })} />)}</DetailPanel> : <Label muted>No linked tasks yet.</Label>}
    {updateTask.isError && <Notice message={errorMessage(updateTask.error)} />}
    <Button secondary title="Add linked task" onPress={() => router.push({ pathname: '/task/new', params: { [kind === 'goals' ? 'goalId' : 'projectId']: id } })} />
    {confirm ? <Card><Label>Delete this {cfg.singular} and its milestones? Linked tasks will be kept.</Label><Button title="Confirm delete" loading={remove.isPending} onPress={() => remove.mutate()} /><Button secondary title="Keep it" disabled={remove.isPending} onPress={() => setConfirm(false)} /></Card> : <Button secondary title={`Delete ${cfg.singular}`} onPress={() => setConfirm(true)} />}
  </Screen>;
}
