'use client';

import { useState, useTransition } from 'react';
import { createTask } from '@/app/actions/createTask';

const EXAMPLES = [
  '50 meals expiring in 2 hours downtown, need drivers',
  'Elderly resident trapped by floodwater on 4th Ave, need medic and first aid',
  'Fallen tree blocking hospital emergency lane, need heavy lifting and debris clearance',
];

interface CrisisDispatchFormProps {
  onTaskCreated?: (taskId: string) => void;
}

export function CrisisDispatchForm({ onTaskCreated }: CrisisDispatchFormProps) {
  const [requestText, setRequestText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestText.trim()) return;

    setError(null);
    setLastCreatedId(null);

    startTransition(async () => {
      const res = await createTask(requestText);
      if (res.success && res.taskId) {
        setRequestText('');
        setLastCreatedId(res.taskId);
        if (onTaskCreated) {
          onTaskCreated(res.taskId);
        }
      } else {
        setError(res.error || 'Failed to dispatch crisis request');
      }
    });
  };

  return (
    <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm mb-6">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-900">
          Incident Dispatch & Natural-Language Parser
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Type or paste an unformatted crisis report. Antigravity AI structures skills, urgency, and location in real time.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <textarea
            id="crisis-input"
            rows={3}
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            placeholder="e.g. 50 meals expiring in 2 hours downtown, need drivers..."
            disabled={isPending}
            className="w-full text-sm p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-slate-900 bg-white placeholder-slate-400"
          />
        </div>

        {/* Demo Example Quick-Fill Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-semibold text-slate-400">Quick Try:</span>
          {EXAMPLES.map((example, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRequestText(example)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded border border-slate-200 transition-colors text-left"
            >
              {example.slice(0, 45)}...
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        {lastCreatedId && (
          <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md flex items-center justify-between">
            <span>
              <strong>Dispatched successfully!</strong> Task ID: <code className="font-mono">{lastCreatedId}</code>
            </span>
            <a
              href={`/task/${lastCreatedId}`}
              className="font-bold underline text-emerald-900 hover:text-emerald-700"
            >
              View Volunteer Link &rarr;
            </a>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending || !requestText.trim()}
            className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-md shadow-sm transition-colors flex items-center justify-center space-x-2"
          >
            {isPending ? (
              <>
                <span>Parsing & Dispatching...</span>
              </>
            ) : (
              <span>Dispatch Emergency Request</span>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
