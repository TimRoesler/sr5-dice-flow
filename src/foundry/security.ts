import type {Mutation,Transaction} from '../types';
export function activeGM(){return game.users?.find((u:any)=>u.active&&u.isGM)}
export async function canOwn(user:any,uuid?:string){if(user?.isGM)return true;if(!uuid)return false;const doc=await fromUuid(uuid);return Boolean(doc?.testUserPermission?.(user,'OWNER'))}
// pendingEffects only records display data plus a derived counter and is double-set-guarded in the
// core, so it skips the optimistic revision check: the sender's snapshot is routinely stale because
// the preceding advance commit round-trips through the GM.
export async function validateMutation(tx:Transaction,request:Mutation,user:any){if(request.transactionId!==tx.id)throw new Error('Wrong transaction');if(request.action!=='pendingEffects'&&request.expectedRevision!==tx.revision)throw new Error('Revision conflict');if(request.userId!==user.id)throw new Error('User mismatch');if(['invalidate','repeat','correct'].includes(request.action)&&!user.isGM)throw new Error('GM only');if(request.action==='addTarget'&&user.id!==tx.authorId&&!user.isGM)throw new Error('Author or GM only');const actorUuid=(request.payload as any)?.actorUuid;if(request.action==='pendingEffects'&&user.id!==tx.authorId&&!user.isGM&&!await canOwn(user,actorUuid))throw new Error('Author, GM or branch owner only');if(['defend','resist','advance','confirm','edge','damageApplied'].includes(request.action)&&!await canOwn(user,actorUuid))throw new Error('Actor ownership required');return true}
export function isSecretRollMode(rollMode?:string){return['blind','gm','blindroll','gmroll'].includes(String(rollMode).toLowerCase())}
export function sanitizeRoll(roll:any,rollMode?:string){return isSecretRollMode(rollMode)?undefined:roll?.toJSON?.()??roll}
