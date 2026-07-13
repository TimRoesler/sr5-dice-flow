import type{FlowSpec}from'../spec';
// First Aid / Medicine heal the patient by the healer's hits (SR5 p. 205). Advisory: applied only on confirm.
export const HEAL_SKILLS=['first_aid','biotechnology','medicine'];
export const heal:FlowSpec={id:'heal',match:origin=>HEAL_SKILLS.includes(String(origin.data?.action?.skill)),branches:'targets',initialStage:()=> 'done',stages:[{id:'apply',branch:'perTarget',testClasses:[],trigger:'systemFollowup',reduce:'merge',next:{always:'done'},confirm:[{id:'healApplied',kind:'heal',when:'always'}]}]};
// Extended tests re-run the same test, accumulating values.extendedHits each iteration (SR5 p. 50).
export const extended:FlowSpec={id:'extended',match:origin=>origin.data?.extended===true&&!origin.data?.opposed?.test,branches:'single',initialStage:()=> 'done',originExtract:['extendedProgress'],cardSections:['extendedProgress'],stages:[]};
