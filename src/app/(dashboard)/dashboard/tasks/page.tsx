'use client';
import { useState, useEffect, useCallback } from 'react';
import { CheckSquare } from 'lucide-react';
import TaskList from '@/components/dashboard/TaskList';
import Spinner from '@/components/ui/Spinner';
import { apiFetch } from '@/lib/api';

interface Task {
  id: string;
  title: string;
  status: 'PENDING' | 'COMPLETED' | 'RESCHEDULED';
  coin_reward: number;
  skill_domain: string | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await apiFetch('/api/tasks');
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      // middleware handles redirect on auth error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const pending = tasks.filter((t) => t.status === 'PENDING').length;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <CheckSquare className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Today&apos;s Tasks</h1>
          <p className="text-gray-500 text-sm mt-0.5">{pending} task{pending !== 1 ? 's' : ''} remaining</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <TaskList tasks={tasks} />
      </div>
    </div>
  );
}
