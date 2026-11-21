import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from './api';
import { getSupabase, supabaseEnabled } from './supabase';
import { useAuthStore } from '../stores/authStore';
import type { User } from '../types';
export type Profile = User & { bio: string };
export type NotificationPreferences = Record<'task_due'|'exam_soon'|'streak_risk'|'goal_deadline'|'assignment_overdue'|'focus_sessions'|'weekly_review',boolean>;
export const getProfile = () => api.get<unknown,Profile>('/settings/profile');
export async function updateProfile(value: {name:string;bio:string;avatar_url?:string|null}) {
  const before=useAuthStore.getState();
  const saved=await api.put<unknown,Profile>('/settings/profile',value,{headers:{Authorization:`Bearer ${before.token}`}});
  if (useAuthStore.getState().user?.id!==before.user?.id || useAuthStore.getState().token!==before.token) throw new Error('Your session changed. Please sign in again.');
  const user={...before.user,...saved} as User;
  useAuthStore.setState({user});
  return saved;
}
/** A photo the user has chosen but not yet saved. */
export type ProfilePhotoDraft = { uri: string; base64: string; mimeType: string };
// Must stay within the `avatars` bucket policy: jpeg/png/webp, 5 MB.
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BASE64_LENGTH = 7_000_000;
const PHOTO_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true,
};

function draftFromAsset(asset: ImagePicker.ImagePickerAsset | undefined): ProfilePhotoDraft {
  if (!asset?.base64) throw new Error('TrackSense could not read that photo. Choose a different image.');
  if (asset.base64.length > MAX_BASE64_LENGTH) throw new Error('Choose a photo smaller than 5 MB.');
  const mimeType = ALLOWED_MIME_TYPES.includes(asset.mimeType ?? '') ? asset.mimeType! : 'image/jpeg';
  return { uri: asset.uri, base64: asset.base64, mimeType };
}

async function launchLibraryPicker() {
  try {
    // Android routes this through the system photo picker, which owns its own
    // consent UI, so no runtime permission is requested up front.
    return await ImagePicker.launchImageLibraryAsync(PHOTO_OPTIONS);
  } catch {
    const permission = await ImagePicker.getMediaLibraryPermissionsAsync().catch(() => null);
    if (permission && !permission.granted && !permission.canAskAgain) {
      throw new Error('Photo access is turned off. Enable it for TrackSense in Android Settings, then try again.');
    }
    throw new Error('TrackSense could not open your photo library. Check app permissions and try again.');
  }
}

async function launchCameraPicker() {
  // Web uses the browser's own media capture prompt instead of app permissions.
  if (Platform.OS !== 'web') {
    const current = await ImagePicker.getCameraPermissionsAsync().catch(() => null);
    if (current && !current.granted && !current.canAskAgain) {
      throw new Error('Camera access is turned off. Enable it for TrackSense in your device settings, then try again.');
    }
    const permission = current?.granted ? current : await ImagePicker.requestCameraPermissionsAsync().catch(() => null);
    if (!permission?.granted) throw new Error('TrackSense needs camera access to take a profile picture. Please allow camera access and try again.');
  }
  try {
    return await ImagePicker.launchCameraAsync(PHOTO_OPTIONS);
  } catch {
    throw new Error('TrackSense could not open the camera. Check that your device has a camera and try again.');
  }
}

/** Opens the gallery and returns a local preview. Returns undefined if cancelled. */
export async function chooseProfilePhoto(): Promise<ProfilePhotoDraft | undefined> {
  const picked = await launchLibraryPicker();
  if (picked.canceled) return undefined;
  return draftFromAsset(picked.assets[0]);
}

/** Opens the camera and returns a local preview. Returns undefined if cancelled. */
export async function takeProfilePhoto(): Promise<ProfilePhotoDraft | undefined> {
  const picked = await launchCameraPicker();
  if (picked.canceled) return undefined;
  return draftFromAsset(picked.assets[0]);
}

/** Uploads the chosen photo to the caller's own storage path. */
export async function uploadProfilePhoto(draft: ProfilePhotoDraft): Promise<string> {
  if (!supabaseEnabled) throw new Error('Photo uploads require Supabase sign-in.');
  const expectedSubject = useAuthStore.getState().providerSubject;
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || data.user.id !== expectedSubject) throw new Error('Please sign in again before uploading a photo.');
  // The bucket policy pins one object per identity, so the key is fixed.
  const path = `${data.user.id}/avatar.jpg`;
  const binary = atob(draft.base64); const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, bytes.buffer, { contentType: draft.mimeType, upsert: true });
  if (uploadError) throw new Error('Photo upload failed. Check the avatars storage configuration and try again.');
  // Cache-bust so a replaced photo is not served from the image cache.
  return `${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
}
export const getNotificationPreferences=()=>api.get<unknown,NotificationPreferences>('/settings/notifications');
export const saveNotificationPreferences=(value:Partial<NotificationPreferences>)=>api.put<unknown,NotificationPreferences>('/settings/notifications',value);
export async function exportMyData() {
  const data=await api.get('/settings/export');
  const json=JSON.stringify(data,null,2);
  if(Platform.OS==='web') {
    const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
    const anchor=document.createElement('a'); anchor.href=url;anchor.download='tracksense-data.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
  }
  if(!await Sharing.isAvailableAsync()) throw new Error('File sharing is unavailable on this device.');
  const file=new File(Paths.cache,'tracksense-data.json');
  try { file.create({overwrite:true});file.write(json);await Sharing.shareAsync(file.uri,{mimeType:'application/json',dialogTitle:'Export TrackSense data'}); }
  finally { if(file.exists) file.delete(); }
}
export const deleteMyAccount=(confirmation:string)=>api.delete<unknown,{status:'deleted'|'pending';message?:string}>('/settings/account',{data:{confirmation}});
