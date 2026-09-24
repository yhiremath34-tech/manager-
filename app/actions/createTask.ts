'use server';

import { supabase } from '@/lib/supabase';
import { parseCrisisRequest } from '@/lib/parseRequest';
import { Task, TaskEvent } from '@/types/database';

export interface CreateTaskResult {
  success: boolean;
  taskId?: string;
  error?: string;
}

export async function createTask(formData: FormData | string): Promise<CreateTaskResult> {
  try {
    const rawRequest = typeof formData === 'string' 
      ? formData 
      : (formData.get('rawRequest') as string | null);

    if (!rawRequest || !rawRequest.trim()) {
      return { success: false, error: 'Crisis request text cannot be empty' };
    }

    // 1. Call parseCrisisRequest
    const parsed = await parseCrisisRequest(rawRequest);

    // 2. Insert row into tasks table
    const { data: insertedTask, error: taskError } = await supabase
      .from('tasks')
      .insert({
        raw_request: rawRequest.trim(),
        parsed_skills: parsed.skills_needed,
        parsed_location: parsed.location_hint,
        urgency: parsed.urgency,
        status: 'open',
      })
      .select('id, raw_request, parsed_skills, parsed_location, urgency, status, created_at')
      .single<Task>();

    if (taskError || !insertedTask) {
      console.error('[createTask] Error inserting task:', taskError);
      return { success: false, error: taskError?.message || 'Failed to insert task' };
    }

    const taskId = insertedTask.id;

    // 3. Insert task_events row with event_type='created'
    const { error: eventError } = await supabase
      .from('task_events')
      .insert({
        task_id: taskId,
        event_type: 'created',
        payload: {
          parsed_skills: parsed.skills_needed,
          urgency: parsed.urgency,
          location_hint: parsed.location_hint,
          summary: parsed.summary,
        },
      });

    if (eventError) {
      console.warn('[createTask] Warning: failed to log task_event:', eventError);
    }

    // 4. Return new task ID
    return { success: true, taskId };
  } catch (err) {
    console.error('[createTask] Unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unknown error occurred',
    };
  }
}
