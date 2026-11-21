// Isolated loopback API using the development tracksense database and disposable users.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
process.env.AUTH_PROVIDER='legacy';
process.env.JWT_SECRET='disposable-api-verification-key-only-32-characters';
const {default:pool,query}=await import('../src/utils/db.js');
const {default:routes}=await import('../src/routes/settingsRoutes.js');
const {default:errorHandler}=await import('../src/middleware/errorHandler.js');
const ids=[];let server;
try {
 assert.equal((await query('SELECT current_database() AS name')).rows[0].name,'tracksense');
 const app=express();app.use(express.json());app.use('/settings',routes);app.use(errorHandler);
 server=await new Promise(resolve=>{const listener=app.listen(0,'127.0.0.1',()=>resolve(listener));});
 const base=`http://127.0.0.1:${server.address().port}/settings`;
 for(const name of ['A','B']) {const user=(await query('INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,email',[`Disposable ${name}`,`profile-${randomUUID()}@example.invalid`,'not-a-login-hash'])).rows[0];ids.push(user);}
 const call=async(index,path,method='GET',body)=>fetch(base+path,{method,headers:{'Content-Type':'application/json',...(index===null?{}:{Authorization:`Bearer ${jwt.sign({id:ids[index].id},process.env.JWT_SECRET,{expiresIn:'5m'})}`})},body:body?JSON.stringify(body):undefined});
 assert.equal((await call(null,'/profile')).status,401);
 assert.equal((await call(0,'/profile','PUT',{name:'Updated A',bio:'API test'})).status,200);
 assert.equal((await (await call(0,'/profile')).json()).bio,'API test');
 assert.equal((await (await call(1,'/profile')).json()).name,'Disposable B');
 assert.equal((await call(1,'/profile','PUT',{name:'Attack',user_id:ids[0].id})).status,400);
 assert.equal((await call(0,'/notifications','PUT',{weekly_review:false})).status,200);
 assert.equal((await (await call(1,'/notifications')).json()).weekly_review,true);
 const data=await (await call(0,'/export')).json();assert.equal(data.user.id,ids[0].id);assert.ok(!JSON.stringify(data).includes('not-a-login-hash'));
 assert.equal((await call(1,'/account','DELETE',{confirmation:ids[0].email})).status,400);
 assert.equal((await call(0,'/account','DELETE',{confirmation:ids[0].email})).status,200);
 assert.equal((await call(0,'/profile')).status,401);
 assert.equal((await call(1,'/profile')).status,200);
 console.log('PASS: live loopback settings API, anonymous rejection, profile save/read, ownership, preferences, export, confirmed disposable deletion and revoked session. Legacy test authentication only.');
} catch(error){console.error(`Settings API verification failed (${error.code||error.name}).`);process.exitCode=1;}
finally {
 if(server)await new Promise(resolve=>server.close(resolve));
 for(const user of ids){await query('DELETE FROM users WHERE id=$1',[user.id]);await query('DELETE FROM account_deletions WHERE user_id=$1',[user.id]);}
 await pool.end();console.log('Disposable settings API users and deletion jobs cleaned up.');
}
