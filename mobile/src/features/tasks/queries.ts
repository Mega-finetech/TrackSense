import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { queryClient } from '../../services/query';
import { useAuthStore } from '../../stores/authStore';
import { Task } from '../../types';

export function useTasks() {
  const id = useAuthStore(state => state.user?.id);
  return useQuery({ queryKey: ['tasks', id], enabled: !!id, queryFn: () => api.get<unknown, Task[]>('/tasks') });
}
export function useUpdateTask() {
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: Task['status'] }) => api.put(`/tasks/${id}`, { status }),
    onSuccess: async () => { await Promise.all(['tasks', 'dashboard', 'projects'].map(key => queryClient.invalidateQueries({ queryKey: [key] }))); } });
}
