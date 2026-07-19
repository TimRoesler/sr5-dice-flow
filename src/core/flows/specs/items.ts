import type{FlowSpec}from'../spec';
// Duck-typed over SR5Item: effects may be a Foundry Collection (iterable) or a plain array, and
// grenades/toxins can carry effects on nested items (item.items).
export function effectList(item:any):any[]{const own=item?.effects?[...item.effects]:[];const nested=(item?.items?[...item.items]:[]).flatMap((child:any)=>child?.effects?[...child.effects]:[]);return[...own,...nested]}
export const isTargetedEffect=(effect:any)=>effect?.system?.applyTo==='targeted_actor'&&!effect?.disabled;
// Self-application covers targeted_actor effects (drugs/toxins used on oneself) plus disabled
// applyTo:'actor' effects — enabled actor effects already run permanently via the system.
export const isSelfEffect=(effect:any)=>(effect?.system?.applyTo==='targeted_actor'||(effect?.system?.applyTo==='actor'&&effect?.disabled===true));
export function hasTargetedItemEffects(item:any){return effectList(item).some(isTargetedEffect)}
export const itemUse:FlowSpec={id:'item-use',match:origin=>!origin.data?.opposed?.test&&hasTargetedItemEffects(origin.test?.item),branches:'targets+self',initialStage:()=> 'done',stages:[],originExtract:['itemUse'],cardSections:['itemUse']};
