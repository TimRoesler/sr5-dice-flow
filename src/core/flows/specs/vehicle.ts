import type{StageReducer}from'../spec';import type{FlowSpec}from'../spec';
// SR5 vehicle combat & chase rules (GRW p. 202–205). Ram AP is fixed at -6; control tests
// after a successful ram use threshold 2 (rammer) / 3 (rammed). All advisory — never mutated.
export const RAM_AP=-6;export const RAM_CONTROL_THRESHOLDS={rammer:2,rammed:3};
// Ram damage table: attacker body scaled by speed in meters per combat turn.
export function ramDamage(body:number,speed:number){const value=Math.max(0,Number(body)||0);return speed<=10?Math.ceil(value/2):speed<=50?value:speed<=200?value*2:value*3}
// Chase ram (short range): target takes body + net hits, the rammer half its own body rounded up.
export function chaseRamDamage(body:number,netHits:number){const value=Math.max(0,Number(body)||0);return{target:value+Math.max(0,netHits),self:Math.ceil(value/2)}}
export const chaseOpposedReducer:StageReducer=({origin,roll})=>{const netHits=Math.max(0,(origin.hits??0)-(roll.hits??0));return{outcome:netHits>0?'success':'failure',derived:{netHits,chaseShift:netHits}}};
const vehicleStages:FlowSpec['stages']=[{id:'chase',branch:'perTarget',testClasses:['PilotVehicleTest'],trigger:'button',reduce:'chaseOpposed',next:{always:'done'}}];
export const vehiclePilot:FlowSpec={id:'vehicle-pilot',match:origin=>origin.testClass==='PilotVehicleTest'&&!origin.data?.opposed?.test,branches:'targets',initialStage:()=> 'chase',originExtract:['vehicleOrigin'],cardSections:['vehicleOrigin'],stages:vehicleStages};
export const dronePerception:FlowSpec={id:'drone-perception',match:origin=>origin.testClass==='DronePerceptionTest',branches:'single',initialStage:()=> 'done',originExtract:['vehicleOrigin'],cardSections:['vehicleOrigin'],stages:[]};
export const droneInfiltration:FlowSpec={id:'drone-infiltration',match:origin=>origin.testClass==='DroneInfiltrationTest',branches:'targets',initialStage:(_branch,origin)=>(origin?.hits??0)>0?'spot':'done',stages:[{id:'spot',branch:'perTarget',testClasses:['PerceptionTest','SuccessTest'],trigger:'button',reduce:'opposedHits',next:{always:'done'}}],originExtract:['vehicleOrigin'],cardSections:['vehicleOrigin']};
