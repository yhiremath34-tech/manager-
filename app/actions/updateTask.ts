'use server';

import { supabase } from '@/lib/supabase';
import { TaskStatus } from '@/types/database';

export interface UpdateTaskResult {
  success: boolean;
  error?: string;
}

export async function acceptTask(taskId: string, volunteerId: string): Promise<UpdateTaskResult> {
  try {
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        assigned_volunteer_id: volunteerId,
        status: 'accepted' as TaskStatus,
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('[acceptTask] Error updating task:', updateError);
      return { success: false, error: updateError.message };
    }

    // Log event in task_events
    await supabase.from('task_events').insert({
      task_id: taskId,
      event_type: 'accepted',
      payload: {
        volunteer_id: volunteerId,
        action: 'Task accepted by volunteer',
        timestamp: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (err) {
    console.error('[acceptTask] Unexpected error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function completeTask(taskId: string): Promise<UpdateTaskResult> {
  try {
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'completed' as TaskStatus,
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('[completeTask] Error updating task:', updateError);
      return { success: false, error: updateError.message };
    }

    // Log event in task_events
    await supabase.from('task_events').insert({
      task_id: taskId,
      event_type: 'completed',
      payload: {
        action: 'Task marked as completed',
        completed_at: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (err) {
    console.error('[completeTask] Unexpected error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
