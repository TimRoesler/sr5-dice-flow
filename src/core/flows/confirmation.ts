import type{StageConfirmation}from'./spec';import type{Branch}from'../../types';
// Deferred item effects can land on any flow (grenade in combat-attack, medkit in heal, …), so
// their confirmations are global instead of being declared on every spec stage.
export const GLOBAL_CONFIRMATIONS:StageConfirmation[]=[{id:'effectsApplied',kind:'effect',when:'derived.pendingEffects'},{id:'selfEffectsApplied',kind:'effect',when:'derived.selfPendingEffects'}];
export function isGlobalConfirmation(id:string,kind:string){return GLOBAL_CONFIRMATIONS.some(value=>value.id===id&&value.kind===kind)}
export function confirmationAvailable(confirmation:StageConfirmation,branch:Branch){if(branch.confirmations[confirmation.id])return false;if(confirmation.when==='always')return true;if(confirmation.when==='done')return branch.stageId==='done';if(confirmation.when==='self')return branch.kind==='self';if(confirmation.when.startsWith('derived.'))return Number(branch.derived[confirmation.when.slice(8)]??0)>0;return false}
