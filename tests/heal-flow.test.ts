import{beforeEach,describe,expect,it,vi}from'vitest';import{confirmationActions,handleCardAction}from'../src/foundry/actions';import{FlowRegistry}from'../src/core/flows/registry';import{extended,heal}from'../src/core/flows/specs/general';import{genericOpposed,genericSimple}from'../src/core/flows/specs/generic';import{registerCoreFlowSpecs}from'../src/core/flows/specs';import{addTarget,createTransaction}from'../src/core/transaction';import{GRW_ACTIONS}from'../src/core/actions-catalog';import{renderCard}from'../src/foundry/card';import{FLAG_KEY,MODULE_ID,type RollRecord,type Transaction}from'../src/types';
const registry=()=>{const flows=new FlowRegistry();flows.register(heal);flows.register(extended);flows.register(genericOpposed);flows.register(genericSimple);return flows};
const healDamage=vi.fn();const warn=vi.fn();const error=vi.fn();
let isGM=true;let isOwner=true;
function healTransaction(origin:Partial<RollRecord>){let tx=createTransaction({kind:'SkillTest',modifiers:[],...origin}as RollRecord,'medic');tx.flowId='heal';tx=addTarget(tx,tx.revision,'medic',{id:'p',actorUuid:'Actor.p',name:'Patient'});return tx}
function healMessage(tx:Transaction){const stored:{tx:Transaction}={tx};return{id:'m1',uuid:'ChatMessage.m1',isAuthor:true,getFlag:(scope:string,key:string)=>scope===MODULE_ID&&key===FLAG_KEY?stored.tx:undefined,update:vi.fn(async(data:any)=>{stored.tx=data[`flags.${MODULE_ID}.${FLAG_KEY}`]}),stored}}
// Mirrors the card markup: the confirm button lives inside .sdf-target next to the track select.
function confirmButton(track?:string){const section={querySelector:(selector:string)=>selector==='[data-sdf-heal-track]'?(track===undefined?null:{value:track}):null};return{dataset:{sdfAction:'confirm',targetId:'p',confirmId:'healApplied',confirmKind:'heal'},closest:(selector:string)=>selector==='.sdf-target'?section:null}as unknown as HTMLElement}
beforeEach(()=>{healDamage.mockClear();warn.mockClear();error.mockClear();isGM=true;isOwner=true;(globalThis as any).game={user:{id:'medic',get isGM(){return isGM}},i18n:{localize:(key:string)=>key,format:(key:string)=>key,has:()=>false}};(globalThis as any).ui={notifications:{warn,error}};(globalThis as any).fromUuid=vi.fn(async()=>({uuid:'Actor.p',name:'Patient',healDamage,testUserPermission:()=>isOwner}));registerCoreFlowSpecs()});
describe('heal flow matching',()=>{
 it('matches first aid only',()=>{const flows=registry();expect(flows.match({testClass:'SkillTest',data:{action:{skill:'first_aid'}}})?.id).toBe('heal')});
 it('never matches medicine or biotechnology, so they cannot clear damage boxes',()=>{const flows=registry();expect(flows.match({testClass:'SkillTest',data:{action:{skill:'medicine'}}})?.id).toBe('generic-simple');expect(flows.match({testClass:'SkillTest',data:{action:{skill:'biotechnology'}}})?.id).toBe('generic-simple')});
});
describe('first aid healing amount',()=>{
 it('heals the net hits above the threshold',async()=>{const tx=healTransaction({hits:3,threshold:2}),message=healMessage(tx);await confirmationActions.get('heal')(message,tx.branches.p!,{healTrack:'physical'});expect(healDamage).toHaveBeenCalledWith('physical',1)});
 it('falls back to the base threshold of 2 when the test declares none',async()=>{const tx=healTransaction({hits:5}),message=healMessage(tx);await confirmationActions.get('heal')(message,tx.branches.p!,{healTrack:'physical'});expect(healDamage).toHaveBeenCalledWith('physical',3)});
 it('does not heal when the hits do not beat the threshold',async()=>{const tx=healTransaction({hits:2,threshold:2}),message=healMessage(tx);await confirmationActions.get('heal')(message,tx.branches.p!,{healTrack:'physical'});expect(healDamage).not.toHaveBeenCalled();expect(warn).toHaveBeenCalledWith('SDF.Error.NoHealing')});
});
describe('first aid track selection',()=>{
 it('heals the selected physical or stun track',async()=>{for(const track of['physical','stun']){healDamage.mockClear();const tx=healTransaction({hits:4,threshold:2}),message=healMessage(tx);await confirmationActions.get('heal')(message,tx.branches.p!,{healTrack:track});expect(healDamage).toHaveBeenCalledWith(track,2)}});
 it('records the healed track in the confirmation payload',async()=>{const tx=healTransaction({hits:4,threshold:2}),message=healMessage(tx);await confirmationActions.get('heal')(message,tx.branches.p!,{healTrack:'stun'});expect(message.stored.tx.branches.p!.confirmations.healApplied!.payload).toEqual({amount:2,track:'stun'})});
 it('mutates nothing without a track choice',async()=>{const tx=healTransaction({hits:4,threshold:2}),message=healMessage(tx);await confirmationActions.get('heal')(message,tx.branches.p!,{});expect(healDamage).not.toHaveBeenCalled();expect(message.update).not.toHaveBeenCalled();expect(warn).toHaveBeenCalledWith('SDF.Error.NoHealTrack')});
 it('rejects a track outside physical and stun',async()=>{const tx=healTransaction({hits:4,threshold:2}),message=healMessage(tx);await confirmationActions.get('heal')(message,tx.branches.p!,{healTrack:'matrix'});expect(healDamage).not.toHaveBeenCalled();expect(message.update).not.toHaveBeenCalled();expect(warn).toHaveBeenCalledWith('SDF.Error.NoHealTrack')});
 it('offers the track choice on the card', ()=>{const html=renderCard(healTransaction({hits:4,threshold:2}));expect(html).toContain('data-sdf-heal-track');expect(html).toContain('value="physical"');expect(html).toContain('value="stun"')});
});
describe('heal card action',()=>{
 it('passes the selected track from the card to the handler',async()=>{const tx=healTransaction({hits:4,threshold:2}),message=healMessage(tx);await handleCardAction({}as any,message,confirmButton('stun'));expect(healDamage).toHaveBeenCalledWith('stun',2)});
 it('refuses to heal while no track is selected on the card',async()=>{const tx=healTransaction({hits:4,threshold:2}),message=healMessage(tx);await handleCardAction({}as any,message,confirmButton(''));expect(healDamage).not.toHaveBeenCalled();expect(message.update).not.toHaveBeenCalled()});
});
describe('heal permissions',()=>{
 it('keeps the owner check for non-GM users',async()=>{isGM=false;isOwner=false;const tx=healTransaction({hits:4,threshold:2}),message=healMessage(tx);await confirmationActions.get('heal')(message,tx.branches.p!,{healTrack:'physical'});expect(healDamage).not.toHaveBeenCalled();expect(warn).toHaveBeenCalledWith('SDF.Error.NoActorOwner')});
 it('keeps the double-confirmation guard',async()=>{const tx=healTransaction({hits:4,threshold:2});tx.branches.p!.confirmations.healApplied={at:1,by:'medic',payload:{amount:2,track:'stun'}};const message=healMessage(tx);await confirmationActions.get('heal')(message,tx.branches.p!,{healTrack:'stun'});expect(healDamage).not.toHaveBeenCalled();expect(warn).toHaveBeenCalledWith('SDF.Error.HealAlreadyApplied')});
});
describe('GRW action catalog',()=>{
 it('lists fire weapon as a simple action',()=>{expect(GRW_ACTIONS.find(action=>action.key==='fireWeapon')?.type).toBe('simple')});
 it('lists changing a linked device mode as a free action',()=>{expect(GRW_ACTIONS.find(action=>action.key==='changeLinkedDeviceMode')?.type).toBe('free')});
});
