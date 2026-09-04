import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://cexkuwkorvunxzetqoyj.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNleGt1d2tvcnZ1bnh6ZXRxb3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMzk4MzEsImV4cCI6MjEwMzkxNTgzMX0.rDn-2M62xL12FSXMOCHTpNRpZygq83MNvxBMHMoj2i8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
