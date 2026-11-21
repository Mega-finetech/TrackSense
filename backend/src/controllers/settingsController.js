import pool, { query } from '../utils/db.js';
import { env } from '../config/env.js';
import * as profile from '../services/profileSettings.js';
import { requestDeletion, processDeletion } from '../services/accountDeletion.js';
import * as settingsModel from '../models/settingsModel.js';
const handler = fn => async (req,res,next) => { try { await fn(req,res); } catch(error) { next(error); } };
export const getUserProfile = handler(async (req,res) => res.json(await profile.readProfile(query,req.user.id)));
export const updateUserProfile = handler(async (req,res) => res.json(await profile.saveProfile(query,req.user.id,req.body)));
export const getUserSettings = handler(async (req,res) => res.json(await settingsModel.getUserSettings(req.user.id)));
export const updateUserSettings = handler(async (req,res) => res.json(await settingsModel.updateUserSettings(req.user.id,req.body)));
export const getNotificationPreferences = handler(async (req,res) => res.json(await profile.readNotifications(query,req.user.id)));
export const updateNotificationPreferences = handler(async (req,res) => res.json(await profile.saveNotifications(query,req.user.id,req.body)));
export const exportUserData = handler(async (req,res) => {
  res.setHeader('Content-Disposition','attachment; filename="tracksense-data.json"');
  res.json(await profile.exportProfileData(query,req.user.id));
});
export const deleteAccount = handler(async (req,res) => {
  const config={supabaseUrl:env.supabaseUrl,adminKey:process.env.SUPABASE_SERVICE_ROLE_KEY};
  try { await requestDeletion(pool,req.user.id,req.body?.confirmation,config); }
  catch (error) {
    if (error.status === 503) return res.status(503).json({error:'Account deletion is not configured. Contact support; no data was deleted.'});
    throw error;
  }
  try { await processDeletion(query,req.user.id,config); res.json({status:'deleted'}); }
  catch { res.status(202).json({status:'pending',message:'Deletion requested. Your account is locked while cleanup completes.'}); }
});
