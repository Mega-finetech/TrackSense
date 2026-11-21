const failure = (status,message) => Object.assign(new Error(message),{status});
export async function requestDeletion(pool,userId,confirmation,config) {
  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');
    const user = (await connection.query('SELECT email FROM users WHERE id=$1 FOR UPDATE',[userId])).rows[0];
    if (!user || confirmation !== user.email) throw failure(400,'Enter your account email to confirm deletion.');
    const identities = (await connection.query('SELECT issuer,subject FROM auth_identities WHERE user_id=$1',[userId])).rows;
    if (identities.length && (!config.adminKey || identities.some(i => i.issuer !== config.supabaseUrl))) throw failure(503,'Account deletion is not configured. Contact support; no data was deleted.');
    await connection.query('INSERT INTO account_deletions (user_id,identities) VALUES ($1,$2) ON CONFLICT (user_id) DO NOTHING',[userId,JSON.stringify(identities)]);
    await connection.query('COMMIT');
  } catch (error) { await connection.query('ROLLBACK'); throw error; }
  finally { connection.release(); }
}
export async function processDeletion(query,userId,config,fetcher=fetch) {
  const job = (await query('SELECT * FROM account_deletions WHERE user_id=$1',[userId])).rows[0];
  if (!job || job.completed_at) return;
  const identities = typeof job.identities === 'string' ? JSON.parse(job.identities) : job.identities;
  for (const identity of identities) {
    if (!config.adminKey || identity.issuer !== config.supabaseUrl) throw failure(503,'Provider deletion configuration is unavailable.');
    const call = (path,method,body) => fetcher(`${config.supabaseUrl}${path}`,{method,headers:{apikey:config.adminKey,Authorization:`Bearer ${config.adminKey}`,'Content-Type':'application/json'},body:body ? JSON.stringify(body) : undefined,redirect:'error',signal:AbortSignal.timeout(15000)});
    // Our photo uploader uses one deterministic object per identity.
    const storage = await call('/storage/v1/object/avatars','DELETE',{prefixes:[`${identity.subject}/avatar.jpg`]});
    if (!storage.ok && storage.status !== 404) throw failure(503,'Photo cleanup is pending.');
    const response = await call(`/auth/v1/admin/users/${identity.subject}`,'DELETE');
    if (!response.ok && response.status !== 404) throw failure(503,'Provider deletion is pending.');
  }
  // One statement makes local cascade and queue completion atomic. Safe to retry.
  await query(`WITH removed AS (DELETE FROM users WHERE id=$1 RETURNING id)
    UPDATE account_deletions SET completed_at=NOW() WHERE user_id=$1`,[userId]);
}
