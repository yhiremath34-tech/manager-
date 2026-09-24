export type TaskUrgency = 'low' | 'medium' | 'high';
export type TaskStatus = 'open' | 'accepted' | 'completed' | 'cancelled';
export type VolunteerAvailability = 'available' | 'busy' | 'offline';

export interface Volunteer {
  id: string;
  name: string;
  phone: string | null;
  skills: string[];
  lat: number | null;
  lng: number | null;
  availability: VolunteerAvailability;
  created_at: string;
}

export interface Task {
  id: string;
  raw_request: string;
  parsed_skills: string[];
  parsed_location: string | null;
  urgency: TaskUrgency;
  status: TaskStatus;
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

export interface ParsedCrisisRequest {
  skills_needed: string[];
  urgency: TaskUrgency;
  location_hint: string;
  summary: string;
}
