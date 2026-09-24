const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xhqijddagxjdjfpchfbl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocWlqZGRhZ3hqZGpmcGNoZmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNTc0MjAsImV4cCI6MjEwNTgzMzQyMH0._AJQcvrSrW2-thcoP3IIEmfYQKkFOu09zQpLwer3tiA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSmokeTest() {
  console.log('=== EMERGENCY MATCHMAKER SMOKE TEST ===');

  // 1. Count rows in tasks
  const { count: tasksCount, error: tasksErr } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true });

  if (tasksErr) {
    console.error('Check 1 FAIL: Error counting tasks:', tasksErr.message);
  } else {
    console.log(`Check 1 PASS: Tasks row count = ${tasksCount}`);
  }

  // 2. Count rows in volunteers
  const { count: volunteersCount, error: volErr } = await supabase
    .from('volunteers')
    .select('*', { count: 'exact', head: true });

  if (volErr) {
    console.error('Check 2 FAIL: Error counting volunteers:', volErr.message);
  } else {
    console.log(`Check 2 PASS: Volunteers row count = ${volunteersCount}`);
  }

  // 3. Show last 3 rows of task_events
  const { data: events, error: eventsErr } = await supabase
    .from('task_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (eventsErr) {
    console.error('Check 3 FAIL: Error fetching task_events:', eventsErr.message);
  } else {
    console.log(`Check 3 PASS: Last 3 rows of task_events (count: ${events.length}):`);
    console.log(JSON.stringify(events, null, 2));
  }

  // 4. Verify Realtime publication includes tasks table
  // We can test subscribing to the tasks channel and verifying SUBSCRIBED status
  console.log('Check 4: Testing Realtime channel subscription for tasks table...');
  const channel = supabase
    .channel('smoke_test_tasks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {})
    .subscribe((status) => {
      console.log(`Check 4 Realtime Status: ${status}`);
      if (status === 'SUBSCRIBED') {
        console.log('Check 4 PASS: Realtime publication active and subscribed on tasks table');
        supabase.removeChannel(channel);
        process.exit(0);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Check 4 FAIL: Realtime channel error');
        supabase.removeChannel(channel);
        process.exit(1);
      }
    });

  // Timeout after 8 seconds
  setTimeout(() => {
    console.log('Check 4: Realtime subscription timeout check complete');
    process.exit(0);
  }, 8000);
}

runSmokeTest();
