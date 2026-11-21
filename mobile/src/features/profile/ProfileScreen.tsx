import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { Bell, Camera, Check, ChevronLeft, ChevronRight, HelpCircle, Info, LogOut, Moon, Shield, SlidersHorizontal, Smartphone, Sun, UserRound, X, type LucideIcon } from 'lucide-react-native';
import ChangePhotoSheet from './ChangePhotoSheet';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../stores/authStore';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { alertTarget, alertVisual } from '../notifications/alertPresentation';
import { syncReminders } from '../../services/reminders';
import { errorMessage } from '../../services/errors';
import { chooseProfilePhoto, deleteMyAccount, exportMyData, getNotificationPreferences, getProfile, saveNotificationPreferences, takeProfilePhoto, updateProfile, uploadProfilePhoto, type NotificationPreferences } from '../../services/profile';

type Panel = 'edit' | 'theme' | 'notifications' | 'privacy' | 'about' | 'logout' | null;
const notificationRows: [keyof NotificationPreferences,string][] = [['task_due','Task Reminders'],['exam_soon','Exam Countdown'],['streak_risk','Streak Warning'],['goal_deadline','Goal Deadlines'],['focus_sessions','Focus Sessions'],['weekly_review','Weekly Review'],['assignment_overdue','Overdue Assignments']];
export default function ProfileScreen() {
  const user = useAuthStore(state => state.user);
  const { colors, mode, setMode, dark } = useTheme();
  const preferences = usePreferencesStore();
  const alerts = useNotificationsStore(state => state.alerts);
  const alertsError = useNotificationsStore(state => state.error);
  const loadAlerts = useNotificationsStore(state => state.load);
  const clearUnreadAlerts = useNotificationsStore(state => state.clearUnreadAlerts);
  const insets = useSafeAreaInsets();
  useFocusEffect(useCallback(() => {
    let active = true;
    // Opening Profile acknowledges the alerts and clears the tab badge.
    void (async () => {
      await clearUnreadAlerts();
      if (active) await loadAlerts();
    })();
    return () => { active = false; };
  }, [clearUnreadAlerts, loadAlerts]));
  const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  const [panel,setPanel]=useState<Panel>(null); const [name,setName]=useState(''); const [bio,setBio]=useState('');
  const [photo,setPhoto]=useState<string|null>(); const [photoSheet,setPhotoSheet]=useState(false); const [photoUploading,setPhotoUploading]=useState(false); const [confirmation,setConfirmation]=useState(''); const [message,setMessage]=useState('');
  const profile=useQuery({queryKey:['profile',user?.id],enabled:!!user,queryFn:getProfile});
  const notifications=useQuery({queryKey:['notificationPreferences',user?.id],enabled:!!user && panel==='notifications',queryFn:getNotificationPreferences});
  const c=dark ? {page:'#0A0F0D',card:'#111915',border:'#2D4A38',divider:'#1A2E22',text:'#F0FDF4',sub:'#86EFAC',muted:'#92AB9C',primary:'#52B788',red:'#F87171',redBg:'#3B0000',avatar:'#1A2E22'} : {page:'#F8F9FA',card:'#FFFFFF',border:'#E5E7EB',divider:'#F3F4F6',text:'#1A1A1A',sub:'#6B7280',muted:'#6B7280',primary:'#1B4332',red:'#DC2626',redBg:'#FEE2E2',avatar:'#1B4332'};
  const person=profile.data || user;
  const initials=(person?.name || 'TrackSense').trim().split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase();
  const version=Constants.expoConfig?.version || '1.0.0';
  async function logout() {
    setBusy(true); setError('');
    try { await useAuthStore.getState().logout(); } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  async function run(action:()=>Promise<void>) {setBusy(true);setError('');setMessage('');try {await action();}catch(cause){setError(errorMessage(cause));}finally{setBusy(false);}}
  function open(next:Panel) {setError('');setMessage('');setConfirmation('');setPhotoSheet(false);setPhotoUploading(false);if(next==='edit'){setName(person?.name || '');setBio(profile.data?.bio || '');setPhoto(person?.avatar_url);}setPanel(next);}
  function permissionAlert(source:'camera'|'gallery') {const camera=source==='camera';Alert.alert(camera?'Camera permission needed':'Photo permission needed',camera?'TrackSense needs camera access to take a profile photo. Enable it in your device settings.':'TrackSense needs access to your photos to choose a profile picture. Enable it in your device settings.',[{text:'Cancel',style:'cancel'},{text:'Open Settings',onPress:()=>{void Linking.openSettings().catch(()=>{});}}]);}
  async function hasPhotoPermission(source:'camera'|'gallery') {if(Platform.OS==='web')return true;if(source==='camera'){const current=await ImagePicker.getCameraPermissionsAsync().catch(()=>null);if(current?.granted)return true;const requested=await ImagePicker.requestCameraPermissionsAsync().catch(()=>null);return !!requested?.granted;}const current=await ImagePicker.getMediaLibraryPermissionsAsync().catch(()=>null);if(current?.granted)return true;const requested=await ImagePicker.requestMediaLibraryPermissionsAsync().catch(()=>null);return !!requested?.granted;}
  function selectPhoto(source:'camera'|'gallery') {setPhotoSheet(false);void run(async()=>{if(!await hasPhotoPermission(source)){permissionAlert(source);return;}const previous=photo ?? person?.avatar_url ?? null;const draft=source==='camera'?await takeProfilePhoto():await chooseProfilePhoto();if(!draft)return;setPhoto(draft.uri);setPhotoUploading(true);try{const avatarUrl=await uploadProfilePhoto(draft);await updateProfile({name:person?.name||'',bio:profile.data?.bio||'',avatar_url:avatarUrl});setPhoto(avatarUrl);await profile.refetch();setMessage('Profile photo updated.');}catch(cause){setPhoto(previous);Alert.alert('Photo upload failed',errorMessage(cause));}finally{setPhotoUploading(false);}});}
  function avatar(uri?:string|null,uploading=false) {return <View style={[s.avatar,{backgroundColor:c.avatar}]}>{uri ? <Image source={{uri}} style={s.avatarImage} /> : <Text style={[s.initials,{color:dark?'#52B788':'#FFFFFF'}]}>{initials}</Text>}{uploading && <View style={[s.avatarUploading,{backgroundColor:colors.surface}]}><ActivityIndicator color={colors.primary}/></View>}</View>;}
  function row(label:string,Icon:LucideIcon,bg:string,color:string,onPress:()=>void,value?:string,last=false) {return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityValue={value?{text:value}:undefined} onPress={onPress} style={[s.row,{borderBottomWidth:last?0:1,borderBottomColor:c.divider}]}><View style={[s.icon,{backgroundColor:dark?c.divider:bg}]}><Icon size={18} color={dark?c.sub:color}/></View><Text style={[s.rowLabel,{color:c.text}]}>{label}</Text>{value && <Text style={[s.value,{color:c.muted}]}>{value}</Text>}<ChevronRight size={16} color={c.muted}/></Pressable>;}
  function button(label:string,onPress:()=>void,danger=false,disabled=false) {return <Pressable accessibilityRole="button" disabled={busy||disabled} onPress={onPress} style={[s.button,{backgroundColor:danger?c.redBg:c.primary,opacity:busy||disabled?0.55:1}]}>{busy?<ActivityIndicator color={danger?c.red:dark?'#0A0F0D':'#FFFFFF'}/>:<Text style={[s.buttonText,{color:danger?c.red:dark?'#0A0F0D':'#FFFFFF'}]}>{label}</Text>}</Pressable>;}
  async function openLink(url:string|undefined,label:string) {if(!url) throw new Error(`${label} has not been configured yet.`);const parsed=new URL(url);if(parsed.protocol!=='https:' && parsed.protocol!=='mailto:') throw new Error('This link is unavailable.');await Linking.openURL(url);}
  const card={backgroundColor:c.card,borderColor:c.border};
  const panelTitle=panel==='edit'?'Edit Profile':panel==='theme'?'Appearance':panel==='notifications'?'Notifications':panel==='privacy'?'Data & Privacy':panel==='logout'?'Sign Out':'About';
  return <SafeAreaView edges={['left','right']} style={[s.screen,{backgroundColor:c.page}]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:24}}>
      <View style={[s.header,{paddingTop:Math.max(insets.top,56)}]}><Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={()=>router.canGoBack()?router.back():router.replace('/')} style={s.back}><ChevronLeft size={24} color={c.text}/></Pressable><Text style={[s.title,{color:c.text}]}>Profile</Text></View>
      {(alerts.length > 0 || !!alertsError) && <View style={s.alertsSection}>
        <View style={s.alertsHeader}><Text style={[s.alertsTitle,{color:c.text}]}>Recent Alerts</Text>{alerts.length > 0 && <Text style={[s.alertsCount,{backgroundColor:dark?c.divider:c.avatar,color:dark?c.sub:'#FFFFFF'}]}>{alerts.length}</Text>}</View>
        {alerts.slice(0, 4).map(alert => { const { Icon, color, background } = alertVisual(alert.type); return <Pressable key={alert.id} accessibilityRole="button" accessibilityLabel={alert.title} onPress={()=>router.navigate({ pathname:(alert.targetScreen ?? alertTarget(alert.type)) as string, params:alert.params })} style={[s.alertCard,card]}><View style={[s.icon,{backgroundColor:dark?c.divider:background,marginRight:12}]}><Icon size={18} color={dark?c.sub:color}/></View><View style={s.alertBody}><Text numberOfLines={1} style={[s.alertTitle,{color:c.text}]}>{alert.title}</Text>{!!alert.message && <Text numberOfLines={2} style={[s.alertMessage,{color:c.sub}]}>{alert.message}</Text>}</View><ChevronRight size={16} color={c.muted}/></Pressable>; })}
        {!!alertsError && <Pressable accessibilityRole="button" accessibilityLabel="Retry alerts" onPress={()=>loadAlerts()}><Text style={[s.alertError,{color:c.red}]}>Could not refresh alerts. Tap to retry.</Text></Pressable>}
      </View>}
      <View style={s.profile}><Pressable accessibilityRole="button" accessibilityLabel="Edit profile photo" onPress={()=>open('edit')} style={s.avatarWrap}>{avatar(person?.avatar_url)}<View style={s.camera}><Camera size={12} color="white"/></View></Pressable><Text style={[s.name,{color:c.text}]}>{person?.name}</Text><Text style={[s.email,{color:c.sub}]}>{person?.email}</Text></View>
      <View style={[s.group,card]}>{row('Edit Profile',UserRound,'#DBEAFE','#2563EB',()=>open('edit'),undefined,true)}</View>
      <View style={[s.group,card]}>{row('Preferences',SlidersHorizontal,'#EDE9FE','#7C3AED',()=>router.push('/preferences'))}{row('Notifications',Bell,'#FEF3C7','#D97706',()=>open('notifications'))}{row('Theme',Moon,'#F3F4F6','#6B7280',()=>open('theme'),mode[0].toUpperCase()+mode.slice(1),true)}</View>
      <View style={[s.group,card]}>{row('Data & Privacy',Shield,'#DCFCE7','#2D6A4F',()=>open('privacy'))}{row('Help & Support',HelpCircle,'#FEE2E2','#DC2626',()=>router.push('/help'))}{row('About',Info,'#F3F4F6','#6B7280',()=>open('about'),`v${version}`,true)}</View>
      <Text style={[s.sync,{color:c.muted}]}>{preferences.syncError?'Showing saved preferences. Cloud synchronization needs attention.':'Your appearance and focus areas sync with your account.'}</Text>
      {!!preferences.syncError && <Pressable accessibilityRole="button" onPress={()=>run(()=>preferences.reload())}><Text style={[s.link,{color:c.primary}]}>Retry preferences sync</Text></Pressable>}
      {profile.isError && <Pressable accessibilityRole="button" onPress={()=>profile.refetch()}><Text style={[s.link,{color:c.red}]}>Could not load profile. Tap to retry.</Text></Pressable>}
      <Pressable accessibilityRole="button" onPress={()=>open('logout')} style={[s.group,s.signout,{backgroundColor:c.card,borderColor:c.redBg}]}><View style={[s.icon,{backgroundColor:c.redBg}]}><LogOut size={16} color={c.red}/></View><Text style={[s.rowLabel,{fontWeight:'600',color:c.red}]}>Sign Out</Text></Pressable>
      <Text style={[s.version,{color:c.muted}]}>TrackSense v{version}</Text><Text style={[s.made,{color:c.muted}]}>Made with 💚 for intentional living</Text>
    </ScrollView>
    <Modal visible={!!panel} transparent animationType="slide" onRequestClose={()=>{if(!busy)setPanel(null);}}>
      <View style={s.scrim}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={s.modalWrapper}><View style={[s.modal,card,{paddingBottom:24+insets.bottom}]}>
        <View style={s.modalHeader}><Text style={[s.title,{color:c.text,flex:1}]}>{panelTitle}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close settings" disabled={busy} onPress={()=>setPanel(null)} style={s.back}><X size={22} color={c.text}/></Pressable></View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {panel==='edit' && <>
            <View style={s.editAvatar}>
              <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" disabled={busy||photoUploading} onPress={()=>setPhotoSheet(true)} style={s.editAvatarPress}>
                {avatar(photo,photoUploading)}
                <View style={[s.editCamera,{backgroundColor:colors.primary}]}><Camera size={13} color={colors.onPrimary}/></View>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" disabled={busy||photoUploading} onPress={()=>setPhotoSheet(true)}><Text style={[s.link,{color:colors.primary}]}>Change Photo</Text></Pressable>
            </View>
            <Text style={[s.fieldLabel,{color:c.text}]}>Full Name</Text>
            <TextInput accessibilityLabel="Full Name" value={name} onChangeText={setName} maxLength={100} style={[s.input,card,{color:c.text}]} />
            <Text style={[s.fieldLabel,{color:c.text}]}>Email (read-only)</Text>
            <TextInput accessibilityLabel="Email" editable={false} value={person?.email} style={[s.input,card,{color:c.muted}]}/>
            <Text style={[s.fieldLabel,{color:c.text}]}>Bio</Text>
            <TextInput accessibilityLabel="Bio" value={bio} onChangeText={setBio} multiline maxLength={500} style={[s.input,s.bio,card,{color:c.text}]}/>
            {button('Save Changes',()=>run(async()=>{if(name.trim().length<2)throw new Error('Name must contain at least 2 characters.');const saved=await updateProfile({name:name.trim(),bio,avatar_url:photo});setPhoto(saved.avatar_url);await profile.refetch();setPanel(null);}),false,profile.isPending||profile.isError||photoUploading)}
          </>}
          {panel==='theme' && (['light','dark','system'] as const).map(value=>{const Icon=value==='light'?Sun:value==='dark'?Moon:Smartphone;return <Pressable key={value} accessibilityRole="button" accessibilityState={{selected:mode===value}} disabled={busy} onPress={()=>run(async()=>{await setMode(value);setPanel(null);})} style={[s.row,{borderBottomColor:c.border,borderBottomWidth:1}]}><Icon size={20} color={c.primary}/><Text style={[s.rowLabel,{color:c.text,marginLeft:12}]}>{value[0].toUpperCase()+value.slice(1)}</Text>{mode===value&&<Check size={20} color={c.primary}/>}</Pressable>;})}
          {panel==='notifications' && <><Text style={[s.description,{color:c.sub}]}>Choose which reminders you want to receive. Preferences sync with your account. Device delivery requires notification permission and reminder scheduling.</Text>{notifications.isPending?<ActivityIndicator color={c.primary}/>:notifications.isError?<Pressable onPress={()=>notifications.refetch()}><Text style={[s.link,{color:c.red}]}>Could not load preferences. Retry</Text></Pressable>:notificationRows.map(([key,label])=><View key={key} style={[s.row,{borderBottomColor:c.divider,borderBottomWidth:1}]}><Text style={[s.rowLabel,{color:c.text}]}>{label}</Text><Switch accessibilityLabel={label} disabled={busy} value={notifications.data?.[key]??false} trackColor={{false:dark?'#1A2E22':'#E5E7EB',true:c.primary}} thumbColor="#FFFFFF" onValueChange={value=>run(async()=>{await saveNotificationPreferences({[key]:value});await notifications.refetch();setMessage(await syncReminders(value));})}/></View>)}</>}
          {panel==='privacy' && <><Text style={[s.description,{color:c.sub}]}>Download your TrackSense records as a JSON file. Keep the exported file private.</Text>{button('Export My Data',()=>run(async()=>{await exportMyData();setMessage('Your data export is ready.');}))}<Pressable onPress={()=>run(()=>openLink(process.env.EXPO_PUBLIC_PRIVACY_URL,'Privacy policy'))}><Text style={[s.link,{color:c.primary}]}>Privacy Policy</Text></Pressable><Pressable onPress={()=>run(()=>openLink(process.env.EXPO_PUBLIC_TERMS_URL,'Terms of service'))}><Text style={[s.link,{color:c.primary}]}>Terms of Service</Text></Pressable><Text style={[s.dangerTitle,{color:c.red}]}>Delete Account</Text><Text style={[s.description,{color:c.sub}]}>This permanently deletes your account and its TrackSense records. This cannot be undone. Export your data first if you need a copy. Enter your email to confirm.</Text><TextInput accessibilityLabel="Confirm account email" autoCapitalize="none" keyboardType="email-address" value={confirmation} onChangeText={setConfirmation} style={[s.input,card,{color:c.text}]}/>{button('Permanently Delete Account',()=>run(async()=>{const result=await deleteMyAccount(confirmation);setMessage(result.status==='pending'?'Deletion requested. Your account is locked while cleanup completes.':'Your account has been deleted.');setPanel('logout');}),true,confirmation!==person?.email)}</>}
          {panel==='about' && <><Text style={[s.name,{color:c.text}]}>TrackSense v{version}</Text><Text style={[s.description,{color:c.sub}]}>Plan → Execute → Track → Understand → Grow</Text><Text style={[s.description,{color:c.sub}]}>A more intentional you.</Text></>}
          {panel==='logout' && <><Text style={[s.description,{color:c.sub}]}>{message || 'Are you sure you want to sign out?'}</Text>{button('Confirm Sign Out',logout,true)}{!message && <Pressable accessibilityRole="button" onPress={()=>setPanel(null)}><Text style={[s.link,{color:c.primary}]}>Cancel</Text></Pressable>}</>}
          {!!error && <Text accessibilityRole="alert" style={[s.feedback,{color:c.red}]}>{error}</Text>}{!!message && panel!=='logout' && <Text style={[s.feedback,{color:c.primary}]}>{message}</Text>}
        </ScrollView>
      </View></KeyboardAvoidingView></View>
    </Modal>
    <ChangePhotoSheet visible={photoSheet} onTakePicture={()=>selectPhoto('camera')} onChooseFromGallery={()=>selectPhoto('gallery')} onCancel={()=>setPhotoSheet(false)} />
  </SafeAreaView>;
}
const s=StyleSheet.create({
  screen:{flex:1},alertsSection:{marginTop:12,marginHorizontal:20,marginBottom:4},alertsHeader:{flexDirection:'row',alignItems:'center',marginBottom:10},alertsTitle:{flex:1,fontSize:15,fontWeight:'700'},alertsCount:{minWidth:22,height:22,borderRadius:11,paddingHorizontal:6,textAlign:'center',fontSize:11,fontWeight:'700',lineHeight:22},alertCard:{borderWidth:1,borderRadius:14,padding:12,flexDirection:'row',alignItems:'center',marginBottom:8},alertBody:{flex:1},alertTitle:{fontSize:14,fontWeight:'600',marginBottom:2},alertMessage:{fontSize:12,lineHeight:17},alertError:{fontSize:12,fontWeight:'600',textAlign:'center',paddingVertical:8},header:{flexDirection:'row',alignItems:'center',paddingHorizontal:20},back:{width:44,height:44,alignItems:'center',justifyContent:'center'},title:{fontSize:20,fontWeight:'700'},profile:{marginTop:24,alignItems:'center',paddingHorizontal:20},avatarWrap:{marginBottom:12},avatar:{width:80,height:80,borderRadius:40,alignItems:'center',justifyContent:'center'},avatarImage:{width:80,height:80,borderRadius:40,resizeMode:'cover'},avatarUploading:{...StyleSheet.absoluteFill,borderRadius:40,alignItems:'center',justifyContent:'center',opacity:0.85},initials:{fontSize:28,fontWeight:'800'},camera:{position:'absolute',bottom:0,right:0,width:24,height:24,borderRadius:12,backgroundColor:'#52B788',alignItems:'center',justifyContent:'center'},name:{fontSize:22,fontWeight:'800',marginBottom:4},email:{fontSize:14,marginBottom:24},group:{borderRadius:16,borderWidth:1,marginHorizontal:20,marginBottom:16,overflow:'hidden',shadowColor:'#000',shadowOpacity:0.04,shadowRadius:4,shadowOffset:{width:0,height:2},elevation:1},row:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:14},icon:{width:32,height:32,borderRadius:8,alignItems:'center',justifyContent:'center',marginRight:12},rowLabel:{flex:1,fontSize:15,fontWeight:'500'},value:{fontSize:14,marginRight:6},signout:{marginTop:8,flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:16},version:{fontSize:12,textAlign:'center',marginTop:16},made:{fontSize:11,textAlign:'center',marginTop:4,marginBottom:32},sync:{fontSize:12,lineHeight:18,marginHorizontal:24,marginBottom:8},link:{fontSize:14,fontWeight:'600',textAlign:'center',paddingVertical:14},scrim:{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'flex-end'},modalWrapper:{maxHeight:'92%',width:'100%'},modal:{borderTopLeftRadius:24,borderTopRightRadius:24,padding:24,borderWidth:1,maxHeight:'100%'},modalHeader:{flexDirection:'row',alignItems:'center',marginBottom:16},editAvatar:{alignItems:'center',marginBottom:8},fieldLabel:{fontSize:14,fontWeight:'600',marginBottom:8},input:{borderWidth:1,borderRadius:12,paddingHorizontal:14,height:52,marginBottom:16,fontSize:15},bio:{height:96,textAlignVertical:'top',paddingTop:12},button:{height:52,borderRadius:26,alignItems:'center',justifyContent:'center',marginTop:8,marginBottom:12},buttonText:{fontSize:16,fontWeight:'700'},description:{fontSize:14,lineHeight:22,marginBottom:16},dangerTitle:{fontSize:18,fontWeight:'700',marginTop:24,marginBottom:12},feedback:{fontSize:14,lineHeight:20,marginTop:12},editAvatarPress:{position:'relative',marginBottom:4},editCamera:{position:'absolute',bottom:0,right:0,width:26,height:26,borderRadius:13,alignItems:'center',justifyContent:'center'},
});
