import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import TaskItem from '@/components/roadmap/TaskItem';
import ProgressBar from '@/components/roadmap/ProgressBar';

interface Task {
  id: string;
  title: string;
  status: 'PENDING' | 'COMPLETED' | 'RESCHEDULED';
  coin_reward: number;
  skill_domain: string | null;
}

interface TaskListProps {
  tasks: Task[];
}

export default function TaskList({ tasks }: TaskListProps) {
  const completed = tasks.filter((t) => t.status === 'COMPLETED').length;

  if (tasks.length === 0) {
    return (
      <div className="text-center py-10">
        <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">
          No tasks yet.{' '}
          <Link href="/roadmap/search" className="text-primary font-semibold hover:underline">
            Create a roadmap
          </Link>{' '}
          to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{completed}/{tasks.length} completed</span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
      <ProgressBar value={tasks.length ? (completed / tasks.length) * 100 : 0} className="mt-1" />
    </div>
  );
}
