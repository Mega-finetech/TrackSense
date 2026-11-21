import pool,{query} from '../src/utils/db.js';
import {env} from '../src/config/env.js';
import {processDeletion} from '../src/services/accountDeletion.js';
try {
  const jobs=(await query('SELECT user_id FROM account_deletions WHERE completed_at IS NULL')).rows;
  let completed=0;
  for(const job of jobs) { try { await processDeletion(query,job.user_id,{supabaseUrl:env.supabaseUrl,adminKey:process.env.SUPABASE_SERVICE_ROLE_KEY}); completed++; } catch { /* Retain for retry; never print provider responses. */ } }
  console.log(JSON.stringify({completed,pending:jobs.length-completed}));
} finally { await pool.end(); }
