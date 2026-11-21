import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {loadMigrations,migrate} from '../src/database/migrations.js';
import {saveProfile,readProfile,saveNotifications,readNotifications,exportProfileData,validateProfile} from '../src/services/profileSettings.js';
import {requestDeletion,processDeletion} from '../src/services/accountDeletion.js';
test('profile, notification and export ownership; confirmed deletion and retry',async()=>{
 const db=new PGlite(); const query=(sql,args)=>args?db.query(sql,args):db.exec(sql).then(r=>r.at(-1));
 const pool={connect:async()=>({query,release(){}})};
 try {
  await migrate({query},await loadMigrations());
  const [a,b]=(await query("INSERT INTO users (name,email,password_hash) VALUES ('Owner A','a@test.invalid','private-hash'),('Owner B','b@test.invalid','private-hash') RETURNING id,email")).rows;
  await saveProfile(query,a.id,{name:'Updated A',bio:'My biography',avatar_url:null});
  assert.equal((await readProfile(query,a.id)).bio,'My biography');
  assert.equal((await readProfile(query,b.id)).name,'Owner B');
  assert.throws(()=>validateProfile({name:'A',email:'b@test.invalid'}),{status:400});
  assert.throws(()=>validateProfile({name:'Alice',avatar_url:'javascript:alert(1)'}),{status:400});
  assert.equal((await saveNotifications(query,a.id,{weekly_review:false,focus_sessions:false})).weekly_review,false);
  assert.equal((await readNotifications(query,b.id)).weekly_review,true);
  await assert.rejects(saveNotifications(query,a.id,{user_id:b.id}),{status:400});
  await query("INSERT INTO goals(user_id,title,category,status) VALUES($1,'Private A','Personal','active'),($2,'Private B','Personal','active')",[a.id,b.id]);
  const exported=await exportProfileData(query,a.id);
  assert.equal(exported.goals.length,1);assert.equal(exported.goals[0].title,'Private A');assert.ok(!JSON.stringify(exported).includes('private-hash'));
  await assert.rejects(requestDeletion(pool,a.id,b.email,{}),{status:400});
  const identity={issuer:'https://example.test',subject:'11111111-1111-4111-8111-111111111111'};
  await query('INSERT INTO auth_identities(issuer,subject,user_id) VALUES($1,$2,$3)',[identity.issuer,identity.subject,a.id]);
  await assert.rejects(requestDeletion(pool,a.id,a.email,{}),{status:503});
  const config={supabaseUrl:identity.issuer,adminKey:'test-admin-only'};
  await requestDeletion(pool,a.id,a.email,config);
  await assert.rejects(processDeletion(query,a.id,config,async()=>({ok:false,status:503})),{status:503});
  assert.ok(await readProfile(query,a.id));
  await processDeletion(query,a.id,config,async()=>({ok:true}));
  assert.equal(await readProfile(query,a.id),undefined);assert.ok(await readProfile(query,b.id));
  assert.equal((await query('SELECT * FROM goals WHERE user_id=$1',[a.id])).rows.length,0);
  await processDeletion(query,a.id,config,()=>{throw new Error('must not run completed job');});
 } finally {await db.close();}
});
