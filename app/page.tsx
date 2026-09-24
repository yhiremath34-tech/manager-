import { CrisisDispatchForm } from '@/components/CrisisDispatchForm';
import { LiveTaskList } from '@/components/LiveTaskList';

export default function CoordinatorDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Title & Intro */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Crisis Coordinator Dashboard
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Zero-touch emergency dispatch. Convert unformatted crisis descriptions into structured triage and match verified local volunteers instantly.
        </p>
      </div>

      {/* Incident Input / AI Parser Form */}
      <CrisisDispatchForm />

      {/* Live Realtime Task Stream */}
      <LiveTaskList />
    </div>
  );
}
