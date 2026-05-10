import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const localProductsWithQuestionnaires = [
  // (We'll paste a few to see if we can insert them into `products` table)
];

async function run() {
  const { data, error } = await supabase.from('products').select('*');
  console.log('Current products:', data?.length);
  if (error) console.error(error);
}
run();
