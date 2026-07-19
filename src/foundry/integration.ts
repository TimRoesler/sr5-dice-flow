import {canRouteFollowup,routeFollowup} from '../core/flows/router';
import {flows} from '../core/flows/registry';
import {reducers} from '../core/reducers';
import {addTarget,createTransaction,migrate} from '../core/transaction';
import {MODULE_ID,type Transaction} from '../types';
import {captureCombatBefore,cloneTestData,extractOrigin,rollRecord,testActorUuid,testClass} from './extract';
import {attachTransaction,getTransaction,saveTransaction} from './store';
import {requestId,socket} from './socket';
import{installAmmoWrapper}from'./ammo';
import{installEffectsWrappers}from'./effects';
import{economyPayload,recordEconomyFromTest}from'./economy';

export const flowMarker=(data:any)=>data?.sr5DiceFlow??data?.following?.sr5DiceFlow;
export async function commitMutation(message:any,tx:Transaction,updated:Transaction,action:string,payload:Record<string,unknown>){if(game.user.isGM||message.isAuthor){await saveTransaction(message,updated);return}await socket.request(message.uuid,{transactionId:tx.id,expectedRevision:tx.revision,action,payload,requestId:requestId(),userId:game.user.id})}

export async function addSelectedTargets(tx:Transaction,test:any,userId:string){const documents=[...(test.targets??[])];if(documents.length===0){for(const uuid of test.data?.targetUuids??[]){const document=await fromUuid(uuid);if(document)documents.push(document)}}for(const document of documents){const isToken=document.documentName==='Token';const actor=isToken?document.actor:document.documentName==='Actor'?document:document.actor;const actorUuid=actor?.uuid;if(!actorUuid)continue;const tokenUuid=isToken?document.uuid:undefined;const duplicate=Object.values(tx.branches).some(target=>target.kind==='target'&&target.actorUuid===actorUuid&&target.tokenUuid===tokenUuid);if(duplicate)continue;tx=addTarget(tx,tx.revision,userId,{actorUuid,tokenUuid,documentUuid:document.uuid,name:document.name??actor.name??game.i18n.localize('SDF.UnknownTarget')})}return tx}

async function captureFollowup(test:any):Promise<any|undefined>{const flow=flowMarker(test.data);const previousId=flow?.messageId??test.data?.previousMessageId;if(!previousId)return;const message=game.messages?.get(previousId)??await fromUuid(previousId);const tx=await getTransaction(message);if(!message||!tx)return;const rollMode=test.data?.options?.rollMode??game.settings.get('core','messageMode'),record=rollRecord(test,rollMode);const result=routeFollowup(tx,{testClass:testClass(test),actorUuid:testActorUuid(test),targetId:flow?.targetId,data:cloneTestData(test)},record,game.user.id,flows,reducers);if(result.status==='captured'){await commitMutation(message,tx,result.transaction,'advance',{branchId:result.branch.id,stageId:result.stage.id,roll:record,data:cloneTestData(test),actorUuid:result.branch.actorUuid});const iniMod=Number(result.branch.derived.iniMod);if(result.stage.id==='defense'&&Number.isFinite(iniMod)&&iniMod!==0)void recordEconomyFromTest(test,{type:'interrupt',iniMod,label:test.data?.title});Hooks.callAll(`${MODULE_ID}.targetStatusChanged`,result.transaction,result.branch);return message}if(result.status==='duplicate')return message;if(game.user.isGM||message.isAuthor)await saveTransaction(message,result.transaction);return}

async function captureOrigin(test:any,record:ReturnType<typeof rollRecord>){const spec=flows.match({testClass:testClass(test),data:test.data,test});let tx=createTransaction(record,game.user.id);if(!spec)return addSelectedTargets(tx,test,game.user.id);tx.flowId=spec.id;const econ=economyPayload(test);if(econ){tx.economy={combatId:econ.combatId,combatantId:econ.combatantId,actionType:econ.type,initiativeMod:econ.iniMod};void recordEconomyFromTest(test)}const extracted=await extractOrigin(spec.originExtract??[],{testClass:testClass(test),data:test.data,test});if(spec.branches==='targets'||spec.branches==='targets+self'){tx=await addSelectedTargets(tx,test,game.user.id);for(const branch of Object.values(tx.branches)){branch.stageId=spec.initialStage(branch,record);branch.stageData.origin=extracted}}if(spec.branches==='single'||spec.branches==='targets+self'){const actorUuid=testActorUuid(test);if(actorUuid){const id=`self-${actorUuid.replace(/\./g,'-')}`;tx.branches[id]={id,kind:'self',actorUuid,name:test.actor?.name??test.source?.name??record.actorName??actorUuid,stageId:'',rolls:{},stageData:{origin:extracted},derived:{...((extracted as any).selfDerived??{})},confirmations:{}};tx.branches[id]!.stageId=spec.initialStage(tx.branches[id]!,record)}}tx.complete=Object.values(tx.branches).length>0&&Object.values(tx.branches).every(branch=>branch.stageId==='done');return tx}

export function shouldSuppressFollowupMessage(data:any,lookup=(id:string)=>game.messages?.get(id)){const testData=data?.flags?.shadowrun5e?.TestData?.data;const marker=flowMarker(testData);const previousId=marker?.messageId??testData?.previousMessageId;if(!previousId)return false;const stored=lookup(previousId)?.getFlag?.(MODULE_ID,'transaction') as any;if(!stored)return false;const tx=migrate(stored),input={testClass:testClass({data:testData}),actorUuid:testData?.actorUuid,targetId:marker?.targetId};if(canRouteFollowup(tx,input,flows))return true;return Boolean(tx.flowId==='combat-attack'&&marker?.targetId&&tx.branches[marker.targetId])}

export function installWrappers(){
    if(!globalThis.window?.libWrapper){console.warn(`${MODULE_ID} | libWrapper unavailable`);return}installAmmoWrapper();installEffectsWrappers();
    const name='SuccessTest';
    if(!game.shadowrun5e?.tests?.[name]){console.warn(`${MODULE_ID} | SuccessTest registry entry unavailable`);return}
    if(game.shadowrun5e?.tests?.RangedAttackTest)try{window.libWrapper.register(MODULE_ID,'game.shadowrun5e.tests.RangedAttackTest.prototype.execute',async function(this:any,wrapped:(...args:any[])=>Promise<any>,...args:any[]){captureCombatBefore(this);return wrapped(...args)},'WRAPPER')}catch(error){console.warn(`${MODULE_ID} | Cannot snapshot ranged attack origin`,error)}
    const path=`game.shadowrun5e.tests.${name}.prototype.toMessage`;
    try{
        window.libWrapper.register(MODULE_ID,path,async function(this:any,wrapped:(...args:any[])=>Promise<any>,...args:any[]){
            const previousId=flowMarker(this.data)?.messageId??this.data?.previousMessageId;
            const temporaryMessage=await wrapped(...args);
            if(previousId){
                try{
                    const originalMessage=await captureFollowup(this);
                    if(temporaryMessage&&originalMessage&&temporaryMessage.id!==originalMessage.id)await temporaryMessage.delete();
                    else if(!temporaryMessage)this.rollDiceSoNice?.();
                    return originalMessage??temporaryMessage;
                }catch(error){
                    console.error(`${MODULE_ID} | follow-up capture failed`,error);
                    return temporaryMessage;
                }
            }
            try{
                if(!temporaryMessage||this.data?.options?.sr5DiceFlow===false)return temporaryMessage;
                const rollMode=this.data?.options?.rollMode??game.settings.get('core','messageMode');
                const record=rollRecord(this,rollMode);
                const tx=await captureOrigin(this,record);
                await attachTransaction(temporaryMessage,tx);
            }catch(error){console.error(`${MODULE_ID} | capture failed`,error)}
            return temporaryMessage;
        },'WRAPPER');
    }catch(error){console.warn(`${MODULE_ID} | Cannot wrap ${name}`,error)}
}
export function registerFallbackHook(){Hooks.on('createChatMessage',async(message:any,_options:any,userId:string)=>{if(userId!==game.user.id||message.getFlag(MODULE_ID,'transaction')||message.flags?.shadowrun5e===undefined)return;Hooks.callAll(`${MODULE_ID}.systemMessage`,message)})}
export function registerCaptureSafetyNet(){Hooks.on('sr5_afterTestComplete',async(test:any)=>{if(!test?.data?.previousMessageId&&!flowMarker(test?.data)?.messageId)return;try{await captureFollowup(test)}catch(error){console.error(`${MODULE_ID} | safety-net capture failed`,error)}})}
