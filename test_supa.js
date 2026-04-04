import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.log("Connected to Supabase! However, there was a query error (which is normal if standard tables don't exist yet):", error.message);
  } else {
    console.log("Connected successfully and able to retrieve data!");
  }
}
test();
