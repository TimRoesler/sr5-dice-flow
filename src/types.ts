export const MODULE_ID = 'sr5-dice-flow'; export const FLAG_KEY = 'transaction'; export const SCHEMA_VERSION = 2; export const SOCKET_PROTOCOL_VERSION = 2; export const DAMAGE_TRACKS = ['physical','stun','matrix'];
export type BranchKind='target'|'self';
export type Visibility='public'|'gm'|'owner';
export interface Modifier {id:string;label:string;value:number;source:string;condition?:string;fingerprint?:string;priority?:number;virtual?:boolean;warning?:string}
export interface EdgeUse {pushTheLimit?:boolean;secondChance?:boolean}
export interface RollRecord {id:string;kind:string;title?:string;actorUuid?:string;actorName?:string;itemName?:string;basePool?:number;pool?:number;hits?:number;rawHits?:number;limit?:number;threshold?:number;glitches?:number;defenseTest?:string;resistanceTest?:string;baseDamage?:number;damageType?:string;rollMode?:string;rollJson?:unknown;edge?:EdgeUse;actionSkill?:string;modifiers:Modifier[];createdAt:number}
export interface Confirmation {at:number;by:string;payload:unknown}
export interface Branch {id:string;kind:BranchKind;tokenUuid?:string;actorUuid:string;documentUuid?:string;name:string;stageId:string;rolls:Record<string,RollRecord>;stageData:Record<string,unknown>;derived:Record<string,number|string|undefined>;confirmations:Record<string,Confirmation>}
export interface FlowEvent {id:string;type:string;at:number;userId:string;payload:Record<string,unknown>;invalidated?:{at:number;by:string;reason:string}}
export interface EconomyState {combatId?:string;combatantId?:string;actionType?:string;initiativeMod?:number}
export interface ExtendedState {iterations:RollRecord[];totalHits:number;threshold?:number;complete:boolean}
export interface Transaction {schemaVersion:2;flowId:string;id:string;revision:number;authorId:string;messageUuid?:string;createdAt:number;updatedAt:number;origin:RollRecord;branches:Record<string,Branch>;economy?:EconomyState;extended?:ExtendedState;calledShotAnnounced?:boolean;events:FlowEvent[];complete:boolean}
export interface Mutation<T=unknown>{transactionId:string;expectedRevision:number;action:string;payload:T;requestId:string;userId:string}
export interface ModifierContext {actor:any;item?:any;testType:string;categories?:string[];wireless?:boolean;equipped?:boolean}
export type ModifierProvider=(context:ModifierContext)=>Modifier[]|Promise<Modifier[]>;
