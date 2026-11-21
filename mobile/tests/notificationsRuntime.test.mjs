import test from 'node:test';
import assert from 'node:assert/strict';
import {createNotificationLoader,supportsNativeNotifications} from '../src/services/notificationsRuntimePolicy.ts';
test('Expo Go and web never invoke the native notification loader',async()=>{
 for(const args of [['android',true,true,true],['ios',true,true,true],['web',false,false,false],['android',false,true,true]]) {
  let imports=0; const load=createNotificationLoader(()=>supportsNativeNotifications(...args),async()=>{imports++;throw new Error('native crash');});
  assert.equal(await load(),null);assert.equal(await load(),null);assert.equal(imports,0);
 }
});
test('installed and development clients lazily load and reuse notifications',async()=>{
 for(const args of [['android',false,false,false],['ios',false,false,false],['android',false,true,false]]){
  let imports=0;const module={schedule:()=>{}};
  const load=createNotificationLoader(()=>supportsNativeNotifications(...args),async()=>{imports++;return module;});
  assert.equal(imports,0);assert.deepEqual(await Promise.all([load(),load()]),[module,module]);assert.equal(imports,1);
 }
});
test('unavailable native module resolves safely without unhandled rejection',async()=>{
 const load=createNotificationLoader(()=>true,async()=>{throw new Error('native module missing');});assert.equal(await load(),null);
});
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
test('actual runtime adapter evaluates safely without loading notifications in Expo Go/web',async()=>{
 const source=readFileSync(new URL('../src/services/notificationsRuntime.ts',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 for(const platform of ['android','ios','web']){
  const exports={};let imports=0;
  vm.runInNewContext(code,{exports,require:name=>{
   if(name==='expo-constants')return {__esModule:true,default:{executionEnvironment:'storeClient',appOwnership:'expo'},ExecutionEnvironment:{StoreClient:'storeClient'}};
   if(name==='expo')return {isRunningInExpoGo:()=>platform!=='web'};
   if(name==='react-native')return {Platform:{OS:platform}};
   if(name==='./notificationsRuntimePolicy')return {createNotificationLoader,supportsNativeNotifications};
   if(name==='expo-notifications'){imports++;throw new Error('Expo Go native crash');}
   throw new Error('Unexpected module: '+name);
  }});
  assert.equal(imports,0);assert.equal(await exports.getNotifications(),null);assert.equal(imports,0);
  assert.match(exports.notificationsDisabledMessage(),/Preferences saved/);
 }
});
