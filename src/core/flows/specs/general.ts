import type{FlowSpec}from'../spec';
// Only First Aid removes damage boxes on the spot (SR5 p. 205). Medicine and Biotechnology treat
// wounds over time and must never mutate a track directly, so they fall through to the generic flow.
export const HEAL_SKILLS=['first_aid'];
// First Aid heals the net hits over the threshold; the track is chosen on the card. Applied only on confirm.
export const HEAL_TRACKS=['physical','stun'];
// Base threshold of a First Aid test is 2 when the test itself declares none (SR5 p. 208).
export const HEAL_BASE_THRESHOLD=2;
export function healingAmount(origin?:{hits?:number;threshold?:number}){const threshold=Number(origin?.threshold);return Math.max(0,Number(origin?.hits??0)-(Number.isFinite(threshold)?threshold:HEAL_BASE_THRESHOLD))}
export const heal:FlowSpec={id:'heal',match:origin=>HEAL_SKILLS.includes(String(origin.data?.action?.skill)),branches:'targets',initialStage:()=> 'done',stages:[{id:'apply',branch:'perTarget',testClasses:[],trigger:'systemFollowup',reduce:'merge',next:{always:'done'},confirm:[{id:'healApplied',kind:'heal',when:'always'}]}]};
// Extended tests re-run the same test, accumulating values.extendedHits each iteration (SR5 p. 50).
export const extended:FlowSpec={id:'extended',match:origin=>origin.data?.extended===true&&!origin.data?.opposed?.test,branches:'single',initialStage:()=> 'done',originExtract:['extendedProgress'],cardSections:['extendedProgress'],stages:[]};
