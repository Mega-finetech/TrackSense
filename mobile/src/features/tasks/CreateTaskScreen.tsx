import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, Heading, Label, Notice, Screen } from '../../components/ui';
import api from '../../services/api';
import { queryClient } from '../../services/query';
import { errorMessage } from '../../services/errors';
import { space } from '../../theme/tokens';

const schema = z.object({ title: z.string().trim().min(1, 'Give your task a name').max(500), description: z.string().max(4000) });
export default function CreateTaskScreen() {
  const { goalId, projectId } = useLocalSearchParams<{ goalId?: string; projectId?: string }>();
  const { control, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { title: '', description: '' } });
  const [today, setToday] = useState(true);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const mutation = useMutation({ mutationFn: (values: z.infer<typeof schema>) => {
    const due = new Date(); due.setHours(23, 59, 0, 0);
    return api.post('/tasks', { ...values, status: 'todo', priority, due_date: today ? due.toISOString() : null, ...(goalId ? { goal_id: goalId } : {}), ...(projectId ? { project_id: projectId } : {}) });
  }, onSuccess: async () => {
    await Promise.all(['tasks', 'dashboard', 'goals', 'projects'].map(key => queryClient.invalidateQueries({ queryKey: [key] })));
    router.back();
  } });
  return <Screen><Heading title="Make a little plan." subtitle="Turn an intention into your next step." />
    <Controller control={control} name="title" render={({ field }) => <Field label="What needs doing?" placeholder="e.g. Read a chapter" value={field.value} onChangeText={field.onChange} error={errors.title?.message} autoFocus />} />
    <Controller control={control} name="description" render={({ field }) => <Field label="A few details (optional)" placeholder="Anything that will help you get started" value={field.value} onChangeText={field.onChange} multiline error={errors.description?.message} />} />
    <Label style={{ fontWeight: '600' }}>Priority</Label><View style={{ flexDirection: 'row', gap: space.sm }}>{(['low', 'medium', 'high'] as const).map(value => <View key={value} style={{ flex: 1 }}><Button title={value.charAt(0).toUpperCase() + value.slice(1)} secondary={priority !== value} onPress={() => setPriority(value)} /></View>)}</View>
    <Button secondary={!today} title={today ? 'Due today ✓' : 'No due date'} onPress={() => setToday(!today)} />
    {mutation.isError && <Notice message={errorMessage(mutation.error)} />}
    <Button title="Save task" loading={mutation.isPending} onPress={handleSubmit(values => mutation.mutate(values))} />
    <Button secondary title="Cancel" disabled={mutation.isPending} onPress={() => router.back()} />
  </Screen>;
}
