'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { apiFetch } from '@/lib/api';

interface BookingFormProps {
  expertId: string;
  onSuccess?: () => void;
}

export default function BookingForm({ expertId, onSuccess }: BookingFormProps) {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState('60');
  const [domain, setDomain] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/api/expert/sessions', {
        method: 'POST',
        body: JSON.stringify({
          expert_id: expertId,
          scheduled_date: new Date(date).toISOString(),
          duration_minutes: parseInt(duration),
          skill_domain: domain || undefined,
          notes: notes || undefined,
        }),
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/expert');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-sm rounded-xl px-4 py-3">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Booking deducts <strong>3,000 coins</strong> from your wallet.</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Date & Time"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B48E8] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
          </select>
        </div>
        <Input
          label="Skill domain (optional)"
          type="text"
          placeholder="e.g. React, Python, System Design"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optional)</label>
          <textarea
            placeholder="What do you want to focus on in this session?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B48E8] resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>
        )}
        <Button type="submit" loading={loading} className="w-full">
          Confirm Booking — 3,000 coins
        </Button>
      </form>
    </div>
  );
}
