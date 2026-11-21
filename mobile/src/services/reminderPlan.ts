export type ReminderEntry={key:string;title:string;body:string;date:Date};
type DatedRecord={id:string;title?:string;subject?:string;due_date?:string;exam_date?:string;deadline?:string;status?:string};
export function buildReminderPlan(prefs:Record<string,boolean>,tasks:DatedRecord[],exams:DatedRecord[],goals:DatedRecord[],hasSpiritualLog:boolean,endAt:number|null,now=new Date()):ReminderEntry[]{
 const entries:ReminderEntry[]=[];
 const dateAt=(value:string,hour:number,daysBefore=0)=>{const date=new Date(value.length===10?`${value}T${String(hour).padStart(2,'0')}:00:00`:value);date.setDate(date.getDate()-daysBefore);return date;};
 if(prefs.task_due)for(const task of tasks)if(task.due_date&&!['done','archived'].includes(task.status||''))entries.push({key:`task:${task.id}`,title:'Task reminder',body:task.title||'A task is due.',date:dateAt(task.due_date,9)});
 if(prefs.exam_soon)for(const exam of exams)if(exam.exam_date)entries.push({key:`exam:${exam.id}`,title:'Exam in 3 days',body:exam.subject||'Upcoming exam',date:dateAt(exam.exam_date,9,3)});
 if(prefs.goal_deadline)for(const goal of goals)if(goal.deadline&&goal.status!=='completed')entries.push({key:`goal:${goal.id}`,title:'Goal due in 3 days',body:goal.title||'Upcoming goal deadline',date:dateAt(goal.deadline,9,3)});
 if(prefs.streak_risk&&!hasSpiritualLog){const date=new Date(now);date.setHours(21,0,0,0);entries.push({key:'spiritual',title:'Time for reflection',body:'Log your spiritual practice for today.',date});}
 if(prefs.focus_sessions&&endAt)entries.push({key:'focus',title:'Focus session complete',body:'Take a break and save your session.',date:new Date(endAt)});
 if(prefs.weekly_review){const date=new Date(now);date.setHours(18,0,0,0);date.setDate(date.getDate()+(7-date.getDay())%7);if(date.getTime()<=now.getTime())date.setDate(date.getDate()+7);entries.push({key:'weekly',title:'Your weekly review',body:'Open TrackSense to reflect on your progress.',date});}
 return entries.filter(e=>Number.isFinite(e.date.getTime())&&e.date.getTime()>now.getTime()).sort((a,b)=>a.date.getTime()-b.date.getTime()).slice(0,50);
}
