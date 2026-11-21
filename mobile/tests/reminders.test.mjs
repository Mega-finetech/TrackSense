import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReminderPlan} from '../src/services/reminderPlan.ts';
test('reminders honor preferences and exclude completed/past/invalid dates',()=>{
 const tasks=[{id:'done',status:'done',due_date:'2026-10-02'},{id:'future',due_date:'2026-10-03'},{id:'past',due_date:'2026-09-01'},{id:'bad',due_date:'bad'}];
 const now=new Date('2026-10-01T12:00:00');
 assert.deepEqual(buildReminderPlan({},tasks,[],[],false,null,now),[]);
 assert.deepEqual(buildReminderPlan({task_due:true},tasks,[],[],false,null,now).map(e=>e.key),['task:future']);
});
test('three-day deadlines, spiritual logging, focus completion and Sunday review',()=>{
 const now=new Date('2026-10-01T12:00:00');
 const plan=buildReminderPlan({exam_soon:true,goal_deadline:true,streak_risk:true,focus_sessions:true,weekly_review:true},[],[{id:'exam',exam_date:'2026-10-05'}],[{id:'goal',deadline:'2026-10-06'}],true,now.getTime()+60000,now);
 assert.ok(!plan.some(e=>e.key==='spiritual'));
 assert.equal(plan.find(e=>e.key==='exam:exam').date.getDate(),2);
 assert.equal(plan.find(e=>e.key==='goal:goal').date.getDate(),3);
 assert.equal(plan.find(e=>e.key==='weekly').date.getDay(),0);
 assert.equal(plan[0].key,'focus');
 assert.equal(buildReminderPlan({task_due:true},Array.from({length:90},(_,i)=>({id:String(i),due_date:'2026-10-10'})),[],[],false,null,now).length,50);
});
