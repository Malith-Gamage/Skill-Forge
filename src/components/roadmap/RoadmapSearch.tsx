'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import { apiFetch } from '@/lib/api';

interface RoadmapSearchProps {
  onSuccess?: (id: string) => void;
}

export default function RoadmapSearch({ onSuccess }: RoadmapSearchProps) {
  const router = useRouter();
  const [skill, setSkill] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    if (!skill.trim()) return;
    setError('');
    setGenerating(true);
    try {
      const rm = await apiFetch('/api/roadmap', {
        method: 'POST',
        body: JSON.stringify({ skill: skill.trim() }),
      });
      if (onSuccess) {
        onSuccess(rm.id);
      } else {
        router.push(`/roadmap/${rm.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate roadmap');
      setGenerating(false);
    }
  }

  return (
    <form onSubmit={handleGenerate} className="flex flex-col gap-4">
      <label className="text-sm font-medium text-gray-700">What skill do you want to learn?</label>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="e.g. React, Machine Learning, Python, UI Design…"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B48E8]"
          disabled={generating}
        />
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}
      {generating && (
        <div className="bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-xl px-4 py-3 text-center">
          ✨ Generating your personalized roadmap… this takes 5–10 seconds
        </div>
      )}
      <Button type="submit" loading={generating} disabled={!skill.trim()} className="w-full">
        Generate Roadmap
      </Button>
    </form>
  );
}
