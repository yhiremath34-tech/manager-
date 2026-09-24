import { TaskEvent } from '@/types/database';

interface TaskEventTimelineProps {
  events: TaskEvent[];
}

export function TaskEventTimeline({ events }: TaskEventTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-xs text-slate-400 italic">
        No state change events logged yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const time = new Date(event.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        return (
          <div key={event.id} className="flex items-start space-x-3 text-xs">
            <span className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded p-2.5">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span className="uppercase tracking-wider text-[11px] text-slate-600">
                  Event: {event.event_type}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{time}</span>
              </div>
              {event.payload && Object.keys(event.payload).length > 0 && (
                <pre className="mt-1 text-[11px] text-slate-600 font-mono whitespace-pre-wrap overflow-x-auto bg-white p-1.5 rounded border border-slate-100">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
