import Link from 'next/link';
import { Task, Volunteer } from '@/types/database';

interface TaskCardProps {
  task: Task;
  volunteers: Volunteer[];
}

export function TaskCard({ task, volunteers }: TaskCardProps) {
  // Find matching volunteer suggestion if task is not yet assigned
  const suggestedVolunteer = !task.assigned_volunteer_id
    ? volunteers.find((v) => {
        if (!v.skills || v.skills.length === 0) return false;
        // Check if volunteer skills overlap with task parsed_skills
        return v.skills.some((skill) =>
          task.parsed_skills.some(
            (reqSkill) =>
              reqSkill.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(reqSkill.toLowerCase())
          )
        );
      })
    : null;

  // Find assigned volunteer name if assigned
  const assignedVolunteer = task.assigned_volunteer_id
    ? volunteers.find((v) => v.id === task.assigned_volunteer_id)
    : null;

  // Urgency styling
  const urgencyColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  // Status styling
  const statusColors = {
    open: 'bg-blue-50 text-blue-700 border-blue-200',
    accepted: 'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const formattedDate = new Date(task.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between">
      <div>
        {/* Top Badges: Urgency, Status, Location, Time */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                urgencyColors[task.urgency] || urgencyColors.medium
              }`}
            >
              {task.urgency} urgency
            </span>
            <span
              className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                statusColors[task.status] || statusColors.open
              }`}
            >
              {task.status}
            </span>
            {task.parsed_location && (
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                📍 {task.parsed_location}
              </span>
            )}
          </div>
          <time className="text-xs text-slate-400 font-mono">{formattedDate}</time>
        </div>

        {/* Raw Crisis Request */}
        <p className="text-sm font-medium text-slate-900 mb-3 leading-relaxed">
          &ldquo;{task.raw_request}&rdquo;
        </p>

        {/* Parsed Skills Needed */}
        <div className="mb-3">
          <span className="text-xs font-bold text-slate-500 block mb-1">
            Skills Needed:
          </span>
          <div className="flex flex-wrap gap-1">
            {task.parsed_skills.length > 0 ? (
              task.parsed_skills.map((skill, index) => (
                <span
                  key={index}
                  className="text-xs font-medium bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">None specified</span>
            )}
          </div>
        </div>

        {/* Assigned Volunteer / Suggested Match */}
        {task.status === 'open' && suggestedVolunteer && (
          <div className="mb-3 p-2.5 bg-blue-50/70 border border-blue-100 rounded-md text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-900">
                Suggested Match: <strong>{suggestedVolunteer.name}</strong>
              </span>
              <span className="text-[11px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-mono">
                {suggestedVolunteer.phone || 'Available'}
              </span>
            </div>
            <div className="text-[11px] text-blue-700 mt-1">
              Skills: {suggestedVolunteer.skills.join(', ')}
            </div>
          </div>
        )}

        {task.assigned_volunteer_id && (
          <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs">
            <span className="text-emerald-800 font-semibold">
              Assigned Volunteer: {assignedVolunteer?.name || task.assigned_volunteer_id.slice(0, 8)}
            </span>
            {task.completed_at && (
              <span className="block text-[11px] text-emerald-600 mt-0.5">
                Completed at: {new Date(task.completed_at).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Action Links */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
        <span className="text-[11px] text-slate-400 font-mono">
          ID: {task.id.slice(0, 8)}...
        </span>
        <Link
          href={`/task/${task.id}`}
          className="text-xs font-bold text-slate-900 hover:text-red-600 flex items-center gap-1"
        >
          <span>Volunteer Link</span>
          <span>&rarr;</span>
        </Link>
      </div>
    </article>
  );
}
