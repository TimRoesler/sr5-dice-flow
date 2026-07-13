import{beforeEach,describe,expect,it,vi}from'vitest';import{applyEconomyMutation,economyPayload}from'../src/foundry/economy';import type{EconomyState}from'../src/core/economy';
let flag:EconomyState|undefined;const setFlag=vi.fn((_m:string,_k:string,value:EconomyState)=>{flag=value});
const combatant={id:'c1',actorId:'a',actor:{uuid:'Actor.a',id:'a'},getFlag:()=>flag,setFlag,unsetFlag:vi.fn(()=>{flag=undefined})};
const combat={id:'combat1',round:2,pass:3,system:{pass:3},combatants:{get:(id:string)=>id==='c1'?combatant:undefined,find:(fn:any)=>[combatant].find(fn),*[Symbol.iterator](){yield combatant}},getActorCombatant:()=>combatant};
const test=(type?:string)=>({actor:{uuid:'Actor.a',id:'a'},data:{id:'roll1',title:'SR5.Attack',action:type?{type,initiative_mod:type==='interrupt'?-10:0}:undefined}});
beforeEach(()=>{flag=undefined;setFlag.mockClear();(globalThis as any).game={combat,combats:{get:(id:string)=>id==='combat1'?combat:undefined},user:{isGM:true},i18n:{localize:(key:string)=>key}}});
describe('economy foundry layer',()=>{
 it('builds a payload from the acting test and combatant',()=>{expect(economyPayload(test('complex'))).toMatchObject({combatId:'combat1',combatantId:'c1',actorUuid:'Actor.a',type:'complex',rollId:'roll1',round:2,pass:3})});
 it('returns nothing for tests without a known action type',()=>{expect(economyPayload(test())).toBeUndefined();expect(economyPayload(test('chatty'))).toBeUndefined()});
 it('forces the type and initiative cost from an override',()=>{expect(economyPayload(test('complex'),{type:'interrupt',iniMod:-10,label:'X'})).toMatchObject({type:'interrupt',iniMod:-10,label:'X'})});
 it('skips tracking outside of combat',()=>{(globalThis as any).game.combat=undefined;expect(economyPayload(test('complex'))).toBeUndefined()});
 it('writes the combatant budget and dedupes repeat rolls',async()=>{const payload=economyPayload(test('complex'))!;await applyEconomyMutation(payload);expect(setFlag).toHaveBeenCalledTimes(1);expect(flag).toMatchObject({complexUsed:1,round:2,pass:3,applied:['roll1']});await applyEconomyMutation(payload);expect(setFlag).toHaveBeenCalledTimes(1);expect(flag!.complexUsed).toBe(1)});
});
