import { buildReminderPlan } from './reminderPlan';
import { Platform } from 'react-native';
import { getNotifications, notificationsDisabledMessage } from './notificationsRuntime';
import api from './api';
import { getNotificationPreferences } from './profile';
import { useAuthStore } from '../stores/authStore';
import { storage } from './storage';
let serial: Promise<unknown> = Promise.resolve();
let scheduledFor: string | null | undefined;
const prefix='tracksense:';
const localDate=()=>{const date=new Date();return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;};
export async function cancelTrackSenseReminders() {
  const Notifications = await getNotifications();
  if(!Notifications)return;
  for(const item of await Notifications.getAllScheduledNotificationsAsync()) if(item.identifier.startsWith(prefix)) await Notifications.cancelScheduledNotificationAsync(item.identifier);
}
export async function cancelFocusReminder() {
  const Notifications = await getNotifications();
  if(!Notifications)return;
  for(const item of await Notifications.getAllScheduledNotificationsAsync()) if(item.identifier.startsWith(prefix)&&item.identifier.endsWith(':focus')) await Notifications.cancelScheduledNotificationAsync(item.identifier);
}
export function syncReminders(requestPermission=false):Promise<string> {
  const work=serial.catch(()=>{}).then(()=>synchronize(requestPermission)); serial=work;return work;
}
async function synchronize(requestPermission:boolean) {
  const Notifications = await getNotifications();
  if(!Notifications)return notificationsDisabledMessage();
  const userId=useAuthStore.getState().user?.id;
  if(scheduledFor!==userId){await cancelTrackSenseReminders();scheduledFor=userId;}
  if(!userId){await cancelTrackSenseReminders();return '';}
  if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('reminders',{name:'TrackSense reminders',importance:Notifications.AndroidImportance.DEFAULT});
  let permission=await Notifications.getPermissionsAsync();
  if(!permission.granted && requestPermission)permission=await Notifications.requestPermissionsAsync();
  if(!permission.granted){await cancelTrackSenseReminders();return 'Preferences saved. Enable notifications in device settings to receive reminders.';}
  const [prefs,tasks,exams,goals,devotions,timer]=await Promise.all([
    getNotificationPreferences(),api.get<unknown,any[]>('/tasks'),api.get<unknown,any[]>('/exams'),api.get<unknown,any[]>('/goals'),
    Promise.all(['devotion','prayer'].map(kind=>api.get<unknown,any[]>(`/spiritual/${kind}`,{params:{start:localDate(),end:localDate()}}))).then(lists=>lists.flat()),storage.get(`tracksense_focus_${userId}`),
  ]);
  if(useAuthStore.getState().user?.id!==userId)return '';
  await cancelTrackSenseReminders();
  const upcoming=buildReminderPlan(prefs,tasks,exams,goals,devotions.length>0,timer?JSON.parse(timer).endAt:null);
  for(const item of upcoming){if(useAuthStore.getState().user?.id!==userId){await cancelTrackSenseReminders();return '';}
    if(item.key==='focus') {
      const latest=await storage.get(`tracksense_focus_${userId}`);
      if(!latest || JSON.parse(latest).endAt!==item.date.getTime())continue;
    }
    await Notifications.scheduleNotificationAsync({identifier:`${prefix}${userId}:${item.key}`,content:{title:item.title,body:item.body,sound:'default'},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:item.date,channelId:'reminders'}});
  }
  return 'Preferences saved and device reminders refreshed.';
}
