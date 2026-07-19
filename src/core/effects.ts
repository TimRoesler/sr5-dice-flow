// Pending item effects are snapshotted into the transaction because dynamic change values can only
// be resolved while the originating test instance is alive; confirm time is too late.
export interface SanitizedEffect {name:string;img?:string;changes:unknown[];disabled?:boolean;duration?:unknown;statuses?:string[];system?:unknown}
export interface PendingEffectsData {itemUuid?:string;itemName?:string;source:'deferred'|'system'|'item';effects:SanitizedEffect[];oversized?:boolean;unresolved?:boolean}
// Message flags must stay small; anything beyond the budget keeps only display metadata and the
// confirm handler re-collects from the live item (without dynamic resolution).
export const PENDING_EFFECTS_BYTE_LIMIT=32*1024;
export function sanitizeEffect(raw:any):SanitizedEffect{return{name:String(raw?.name??''),img:raw?.img||undefined,changes:Array.isArray(raw?.changes)?raw.changes.map((change:any)=>({key:change?.key,mode:change?.mode,value:change?.value,priority:change?.priority})):[],disabled:raw?.disabled||undefined,duration:raw?.duration,statuses:Array.isArray(raw?.statuses)?raw.statuses:undefined,system:raw?.system}}
export function buildPendingEffects(raw:any[],base:Omit<PendingEffectsData,'effects'>,limit=PENDING_EFFECTS_BYTE_LIMIT):PendingEffectsData{const effects=raw.map(sanitizeEffect);const data:PendingEffectsData={...base,effects};try{if(JSON.stringify(data).length<=limit)return data}catch{/* non-serializable payload falls through to the name-only snapshot */}
return{...base,effects:effects.map(effect=>({name:effect.name,img:effect.img,changes:[]})),oversized:true}}
export function pendingEffectNames(data?:PendingEffectsData){return(data?.effects??[]).map(effect=>effect.name).filter(Boolean)}
