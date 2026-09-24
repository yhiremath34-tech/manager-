# Technical Specification: Emergency Matchmaker

Zero-Touch Volunteer Coordination for Hyper-Local Crises

---

## 1. Database Schema

The database is built on PostgreSQL hosted via Supabase. All primary keys use `UUID` with `gen_random_uuid()`. Timestamps default to `now()`.

### 1.1 Tables and Definitions

#### Table: `volunteers`
Stores volunteer contact details, skill inventory, geographic coordinates, and availability status.
```sql
CREATE TABLE public.volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    skills TEXT[] NOT NULL DEFAULT '{}',
    lat FLOAT8,
    lng FLOAT8,
    availability TEXT NOT NULL DEFAULT 'available', -- 'available' | 'busy' | 'offline'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Table: `tasks`
Stores crisis incident requests, structured AI parser extractions, assignment status, and resolution timestamps.
```sql
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_request TEXT NOT NULL,
    parsed_skills TEXT[] NOT NULL DEFAULT '{}',
    parsed_location TEXT,
    urgency TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high'
    status TEXT NOT NULL DEFAULT 'open',   -- 'open' | 'accepted' | 'completed' | 'cancelled'
    assigned_volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);
```

#### Table: `task_events`
Audit trail of lifecycle state transitions for tasks (creation, assignments, completions).
```sql
CREATE TABLE public.task_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,              -- 'created' | 'assigned' | 'accepted' | 'completed' | 'status_change'
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 1.2 Indexes
- `idx_tasks_status` on `tasks(status)`
- `idx_tasks_created_at` on `tasks(created_at DESC)`
- `idx_volunteers_skills` on `volunteers USING GIN (skills)`
- `idx_tasks_parsed_skills` on `tasks USING GIN (parsed_skills)`
- `idx_task_events_task_id` on `task_events(task_id)`

---

## 2. Row Level Security (RLS) Policies

Row Level Security is enabled on all tables (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

### 2.1 Table: `volunteers`
- **SELECT Policy (`Anyone can read volunteers`)**:
  - `FOR SELECT USING (true);`
  - *Rationale*: Coordinators and task matchers need to read volunteer skillsets and names to display matching suggestions.
- **INSERT/UPDATE Policy**:
  - `FOR ALL USING (auth.role() = 'service_role');` (or open INSERT for volunteer registration in hackathon context).

### 2.2 Table: `tasks`
- **SELECT Policy (`Anyone can read tasks`)**:
  - `FOR SELECT USING (true);`
  - *Rationale*: Realtime coordinator dashboard and public volunteer task links must query tasks without authentication.
- **INSERT Policy (`Anyone can insert tasks`)**:
  - `FOR INSERT WITH CHECK (true);`
  - *Rationale*: Anonymous crisis coordinators can dispatch emergency requests immediately without login friction.
- **UPDATE Policy (`Volunteers and coordinators can update task status`)**:
  - `FOR UPDATE USING (true) WITH CHECK (true);`
  - *Rationale*: In an emergency response setting, volunteers access task resolution links directly via UUID tokens to accept and mark tasks complete.

### 2.3 Table: `task_events`
- **SELECT Policy (`Anyone can read task events`)**:
  - `FOR SELECT USING (true);`
- **INSERT Policy (`Anyone can insert task events`)**:
  - `FOR INSERT WITH CHECK (true);`
  - *Rationale*: Allows logging state transitions from server actions and client task updates.

---

## 3. API Routes & Server Actions

### 3.1 AI Parsing Layer (`/lib/parseRequest.ts`)
- **Function**: `parseCrisisRequest(input: string): Promise<ParsedCrisisRequest>`
- **Type**:
  ```typescript
  export interface ParsedCrisisRequest {
    skills_needed: string[];
    urgency: 'low' | 'medium' | 'high';
    location_hint: string;
    summary: string;
  }
  ```
- **Execution Strategy**:
  - Primary: Server-side `fetch` calling OpenAI API (`gpt-4o-mini`) using `response_format: { type: "json_object" }` with a strict JSON schema prompt.
  - Fallback: Deterministic regex/keyword heuristics extractor (detects urgency keywords like "dying", "urgent", "hours", "immediate"; extracts skill keywords like "driver", "medic", "food", "shelter", "heavy lifting"; extracts common location prepositional phrases).

### 3.2 Server Actions (`/app/actions/`)

#### 1. `createTaskAction(rawRequest: string)` (`/app/actions/createTask.ts`)
- **Input**: `{ rawRequest: string }`
- **Flow**:
  1. Validate non-empty string.
  2. Invoke `parseCrisisRequest(rawRequest)`.
  3. Insert row into `tasks` via Supabase client:
     - `raw_request`: raw text
     - `parsed_skills`: parsed array
     - `parsed_location`: extracted location
     - `urgency`: 'low' | 'medium' | 'high'
     - `status`: 'open'
  4. Insert row into `task_events`:
     - `task_id`: new task id
     - `event_type`: 'created'
     - `payload`: `{ parsed_skills, parsed_location, urgency, summary }`
  5. Return `{ success: true, taskId: string }` or `{ success: false, error: string }`.

#### 2. `updateTaskStatusAction(taskId: string, status: 'accepted' | 'completed', volunteerId?: string)` (`/app/actions/updateTask.ts`)
- **Input**: `{ taskId: string, status: 'accepted' | 'completed', volunteerId?: string }`
- **Flow**:
  1. Update `tasks` row (`status`, `assigned_volunteer_id`, `completed_at` if completed).
  2. Insert row into `task_events` (`event_type: status`, `payload: { volunteerId, timestamp }`).
  3. Revalidate path `/task/[id]` and `/`.
  4. Return `{ success: true }`.

### 3.3 Route Handlers (`/app/api/`)

#### `/app/api/health/route.ts` (GET)
- Executes `supabase.from('tasks').select('id', { head: true, count: 'exact' })`.
- Returns HTTP 200 `{ status: 'ok', supabase: 'connected' }` if database responds, or HTTP 500 `{ status: 'error', message: err.message }`.

---

## 4. Frontend Page and Component Breakdown

Built with Next.js 14 App Router, TypeScript, and clean Tailwind CSS (no external decorative component libraries).

### 4.1 Global TypeScript Types (`/types/database.ts`)
```typescript
export interface Volunteer {
  id: string;
  name: string;
  phone: string | null;
  skills: string[];
  lat: number | null;
  lng: number | null;
  availability: 'available' | 'busy' | 'offline';
  created_at: string;
}

export interface Task {
  id: string;
  raw_request: string;
  parsed_skills: string[];
  parsed_location: string | null;
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'accepted' | 'completed' | 'cancelled';
  assigned_volunteer_id: string | null;
  created_at: string;
  completed_at: string | null;
  assigned_volunteer?: Volunteer | null;
}

export interface TaskEvent {
  id: string;
  task_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}
```

### 4.2 Page 1: Coordinator Dashboard (`/app/page.tsx`)
- **Purpose**: Rapid incident entry and live situational awareness.
- **Components**:
  - `Navbar.tsx` (`/components/Navbar.tsx`): Header with app name, live status indicator, and quick links.
  - `CrisisDispatchForm.tsx` (`/components/CrisisDispatchForm.tsx`):
    - Textarea for natural language crisis description.
    - Example prompt chips (e.g., "50 meals downtown expiring", "Elderly resident needs sandbags").
    - "Dispatch Request" action button with loading states.
  - `TaskCard.tsx` (`/components/TaskCard.tsx`):
    - Displays raw request, urgency badge (red/amber/emerald), location hint, parsed skills tags.
    - Status pill (`open`, `accepted`, `completed`).
    - Smart Matchmaker module: queries available volunteers whose `skills` array overlaps with `parsed_skills`. Displays "Suggested: [Volunteer Name] ([matching skills])".
    - Direct link to volunteer task view (`/task/[id]`).
  - `LiveTaskList.tsx` (`/components/LiveTaskList.tsx`):
    - Realtime list container subscribing to Supabase changes on `tasks`.
    - Filter tabs: All, Open, In Progress, Completed.

### 4.3 Page 2: Volunteer Task View (`/app/task/[id]/page.tsx`)
- **Purpose**: Zero-friction, standalone mobile web view for matched volunteers to accept and complete tasks.
- **Components**:
  - `TaskDetailHeader.tsx` (`/components/TaskDetailHeader.tsx`): Urgency, status indicator, relative timestamp.
  - `TaskDetailBody.tsx` (`/components/TaskDetailBody.tsx`): Structured view of raw request, parsed location, and required skills.
  - `VolunteerAssignmentControl.tsx` (`/components/VolunteerAssignmentControl.tsx`):
    - Volunteer selector / name input for simulation.
    - "Accept Task" button (transitions `open` -> `accepted`).
    - "Mark as Completed" button (transitions `accepted` -> `completed`).
  - `TaskEventTimeline.tsx` (`/components/TaskEventTimeline.tsx`): Visual chronological log of `task_events` associated with this task.

---

## 5. Realtime Subscription Strategy

1. **Database Replication Setup**:
   - The `tasks` table is added to the Supabase Realtime publication:
     ```sql
     ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
     ```
   - `REPLICA IDENTITY FULL` enabled on `tasks` to ensure entire row payloads are emitted on updates.

2. **Client-Side Realtime Implementation**:
   - `LiveTaskList` initializes a Supabase browser client (`createBrowserClient` or standard `createClient` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
   - Channel subscription:
     ```typescript
     const channel = supabase
       .channel('tasks-realtime-channel')
       .on(
         'postgres_changes',
         { event: '*', schema: 'public', table: 'tasks' },
         (payload) => {
           if (payload.eventType === 'INSERT') {
             setTasks((prev) => [payload.new as Task, ...prev]);
           } else if (payload.eventType === 'UPDATE') {
             setTasks((prev) =>
               prev.map((t) => (t.id === payload.new.id ? (payload.new as Task) : t))
             );
           } else if (payload.eventType === 'DELETE') {
             setTasks((prev) => prev.filter((t) => t.id === payload.old.id));
           }
         }
       )
       .subscribe();
     ```
   - Cleanup hook removes channel subscription on component unmount (`supabase.removeChannel(channel)`).

---

## 6. Environment Variables Required

| Variable Name | Environment | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client & Server | The URL of the Supabase project instance |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client & Server | The public anon key for database queries and Realtime |
| `OPENAI_API_KEY` | Server-Side Only | API key for OpenAI gpt-4o-mini structured parsing |

---
