// Disposable records inside a rolled-back transaction, only in tracksense.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import pool from '../src/utils/db.js';
import {readProfile,saveProfile,readNotifications,saveNotifications,exportProfileData} from '../src/services/profileSettings.js';
const client=await pool.connect();
try {
 assert.equal((await client.query('SELECT current_database() AS name')).rows[0].name,'tracksense');
 await client.query('BEGIN');
 const query=(sql,args)=>client.query(sql,args);
 const suffix=randomUUID();
 const a=(await query("INSERT INTO users(name,email,password_hash) VALUES('Disposable A',$1,'not-a-login-hash') RETURNING id",[`settings-a-${suffix}@example.invalid`])).rows[0];
 const b=(await query("INSERT INTO users(name,email,password_hash) VALUES('Disposable B',$1,'not-a-login-hash') RETURNING id",[`settings-b-${suffix}@example.invalid`])).rows[0];
 await saveProfile(query,a.id,{name:'Updated A',bio:'Disposable biography'});
 assert.equal((await readProfile(query,a.id)).bio,'Disposable biography');assert.equal((await readProfile(query,b.id)).name,'Disposable B');
 await saveNotifications(query,a.id,{weekly_review:false});assert.equal((await readNotifications(query,a.id)).weekly_review,false);assert.equal((await readNotifications(query,b.id)).weekly_review,true);
 await query("INSERT INTO goals(user_id,title,category,status) VALUES($1,'Private test goal','Personal','active')",[a.id]);
 const data=await exportProfileData(query,a.id);assert.equal(data.goals.length,1);assert.equal((await exportProfileData(query,b.id)).goals.length,0);assert.ok(!JSON.stringify(data).includes('not-a-login-hash'));
 console.log('PASS: live tracksense profile/bio, notification preferences and export isolation. Disposable transaction only.');
} catch(error) {console.error(`Settings verification failed (${error.code || error.name}).`);process.exitCode=1;}
finally {await client.query('ROLLBACK');client.release();await pool.end();console.log('Disposable verification transaction rolled back.');}
