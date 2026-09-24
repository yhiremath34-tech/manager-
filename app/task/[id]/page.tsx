'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Task, Volunteer, TaskEvent } from '@/types/database';
import { acceptTask, completeTask } from '@/app/actions/updateTask';
import { TaskEventTimeline } from '@/components/TaskEventTimeline';

export default function VolunteerTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadTaskData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Task
      const { data: taskData, error: taskErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single<Task>();

      if (taskErr || !taskData) {
        throw new Error(taskErr?.message || 'Task not found');
      }

      setTask(taskData);
      if (taskData.assigned_volunteer_id) {
        setSelectedVolunteerId(taskData.assigned_volunteer_id);
      }

      // 2. Fetch Volunteers
      const { data: volData } = await supabase.from('volunteers').select('*');
      if (volData && volData.length > 0) {
        setVolunteers(volData);
        if (!taskData.assigned_volunteer_id) {
          setSelectedVolunteerId(volData[0].id);
        }
      }

      // 3. Fetch Task Events
      const { data: eventData } = await supabase
        .from('task_events')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (eventData) {
        setEvents(eventData);
      }
    } catch (err) {
      console.error('[VolunteerTaskPage] Error fetching task:', err);
      setError(err instanceof Error ? err.message : 'Error fetching task');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      loadTaskData();

      // Realtime subscription for this task
      const channel = supabase
        .channel(`task:${taskId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks', filter: `id=eq.${taskId}` },
          (payload) => {
            if (payload.new) {
              setTask(payload.new as Task);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'task_events', filter: `task_id=eq.${taskId}` },
          (payload) => {
            if (payload.new) {
              setEvents((prev) => [payload.new as TaskEvent, ...prev]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [taskId, loadTaskData]);

  const handleAccept = () => {
    if (!selectedVolunteerId) {
      setError('Please select a volunteer profile first');
      return;
    }

    setError(null);
    setActionMessage(null);

    startTransition(async () => {
      const res = await acceptTask(taskId, selectedVolunteerId);
      if (res.success) {
        setActionMessage('Task accepted successfully!');
        loadTaskData();
      } else {
        setError(res.error || 'Failed to accept task');
      }
    });
  };

  const handleComplete = () => {
    setError(null);
    setActionMessage(null);

    startTransition(async () => {
      const res = await completeTask(taskId);
      if (res.success) {
        setActionMessage('Task marked as complete! Thank you.');
        loadTaskData();
      } else {
        setError(res.error || 'Failed to complete task');
      }
    });
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        Loading emergency task details...
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="py-12 max-w-lg mx-auto text-center space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          <strong>Error:</strong> {error}
        </div>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md"
        >
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!task) return null;

  const assignedVolunteer = volunteers.find((v) => v.id === task.assigned_volunteer_id);

  const urgencyBadge = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-amber-100 text-amber-800 border-amber-300',
    low: 'bg-slate-100 text-slate-700 border-slate-300',
  }[task.urgency];

  const statusBadge = {
    open: 'bg-blue-100 text-blue-800 border-blue-300',
    accepted: 'bg-amber-100 text-amber-800 border-amber-300',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    cancelled: 'bg-slate-100 text-slate-500 border-slate-300',
  }[task.status];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
        >
          <span>&larr;</span>
          <span>Back to Coordinator Dashboard</span>
        </Link>
      </div>

      {/* Task Header Box */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-400">
              DISPATCH ID: {task.id}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${urgencyBadge}`}
              >
                {task.urgency} Urgency
              </span>
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${statusBadge}`}
              >
                {task.status}
              </span>
            </div>
          </div>

          <div className="text-right text-xs text-slate-500">
            <div>Reported: {new Date(task.created_at).toLocaleString()}</div>
            {task.completed_at && (
              <div className="text-emerald-700 font-semibold mt-0.5">
                Completed: {new Date(task.completed_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Crisis Incident Body */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Crisis Incident Report
          </h2>
          <p className="text-base font-semibold text-slate-900 bg-slate-50 p-3.5 rounded border border-slate-200">
            &ldquo;{task.raw_request}&rdquo;
          </p>
        </div>

        {/* Location & Skills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <h3 className="text-xs font-bold text-slate-500 mb-1">
              📍 Location Hint
            </h3>
            <p className="text-sm font-medium text-slate-800">
              {task.parsed_location || 'Downtown / Area coordinates pending'}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 mb-1">
              🛠️ Skills Required
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {task.parsed_skills.map((skill, i) => (
                <span
                  key={i}
                  className="text-xs font-semibold bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Volunteer Action Box */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Volunteer Response Actions
        </h2>

        {error && (
          <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        {actionMessage && (
          <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md">
            {actionMessage}
          </div>
        )}

        {task.status === 'open' && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="volunteer-select"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Accepting as Volunteer:
              </label>
              <select
                id="volunteer-select"
                value={selectedVolunteerId}
                onChange={(e) => setSelectedVolunteerId(e.target.value)}
                disabled={isPending}
                className="w-full text-sm p-2.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {volunteers.map((vol) => (
                  <option key={vol.id} value={vol.id}>
                    {vol.name} — Skills: {vol.skills.join(', ')} ({vol.availability})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAccept}
              disabled={isPending}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-md shadow-sm transition-colors"
            >
              {isPending ? 'Accepting...' : 'Accept Task & Mobilize'}
            </button>
          </div>
        )}

        {task.status === 'accepted' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
              <strong>Task is currently IN PROGRESS.</strong> Assigned to:{' '}
              <span className="font-bold">
                {assignedVolunteer?.name || task.assigned_volunteer_id}
              </span>{' '}
              ({assignedVolunteer?.phone || 'On route'}).
            </div>

            <button
              onClick={handleComplete}
              disabled={isPending}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-md shadow-sm transition-colors"
            >
              {isPending ? 'Marking Complete...' : 'Mark Task as Completed'}
            </button>
          </div>
        )}

        {task.status === 'completed' && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-center text-sm font-semibold text-emerald-900">
            ✓ This emergency task was resolved and marked completed!
          </div>
        )}
      </section>

      {/* Task Event Audit Trail */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Task Event Audit Trail (Realtime Log)
        </h2>
        <TaskEventTimeline events={events} />
      </section>
    </div>
  );
}
