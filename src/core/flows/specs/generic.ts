import type{FlowSpec}from'../spec';
export const genericOpposed:FlowSpec={id:'generic-opposed',match:origin=>Boolean(origin.data?.opposed?.test),branches:'targets',initialStage:(_branch,origin)=>origin?.defenseTest&&(origin.hits??0)>0?'opposed':'done',stages:[{id:'opposed',branch:'perTarget',testClasses:['$origin.defenseTest'],trigger:'button',reduce:'opposedHits',next:{always:'done'}}]};
export const genericSimple:FlowSpec={id:'generic-simple',match:()=>true,branches:'single',initialStage:()=> 'done',stages:[]};
