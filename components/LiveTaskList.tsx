'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Task, Volunteer, TaskStatus } from '@/types/database';
import { TaskCard } from './TaskCard';

export function LiveTaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  // Load initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tasks sorted by created_at DESC
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) {
        throw tasksError;
      }

      // Fetch volunteers
      const { data: volData, error: volError } = await supabase
        .from('volunteers')
        .select('*');

      if (volError) {
        throw volError;
      }

      setTasks(tasksData || []);
      setVolunteers(volData || []);
    } catch (err) {
      console.error('[LiveTaskList] Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Setup Supabase Realtime subscription on tasks table
    const channel = supabase
      .channel('public:tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = payload.new as Task;
            setTasks((prev) => [newTask, ...prev.filter((t) => t.id !== newTask.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Task;
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            );
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            setTasks((prev) => prev.filter((t) => t.id !== deleted.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const countByStatus = {
    all: tasks.length,
    open: tasks.filter((t) => t.status === 'open').length,
    accepted: tasks.filter((t) => t.status === 'accepted').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Live Incident Stream</span>
            <span
              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                realtimeStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {realtimeStatus === 'connected' ? '● Realtime Subscribed' : 'Connecting...'}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Realtime database replication powered by Supabase & Postgres
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-md text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded transition-colors ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({countByStatus.all})
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-3 py-1 rounded transition-colors ${
              filter === 'open'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Open ({countByStatus.open})
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-3 py-1 rounded transition-colors ${
              filter === 'accepted'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Accepted ({countByStatus.accepted})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded transition-colors ${
              filter === 'completed'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({countByStatus.completed})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Loading live crisis tasks from Supabase...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-500">
          <p className="text-sm font-semibold text-slate-700">No tasks in this category</p>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch a crisis request above to see it appear instantly in real time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} volunteers={volunteers} />
          ))}
        </div>
      )}
    </section>
  );
}
