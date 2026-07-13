import type{Branch,RollRecord}from'../../types';
export type StageBranch='perTarget'|'self';export type StageTrigger='button'|'systemFollowup'|'systemOpposed';export type StageOutcome='success'|'failure';export type ConfirmationKind='damage'|'drain'|'ammo'|'marks'|'initiative'|'fade'|'heal';
export interface StageTransition {onSuccess?:string;onFailure?:string;always?:string}
export interface StageConfirmation {id:string;kind:ConfirmationKind;when:string}
export interface StageSpec {id:string;branch:StageBranch;testClasses:string[];trigger:StageTrigger;reduce:string;next:StageTransition;confirm?:StageConfirmation[];defenseOptions?:boolean;action?:string;gm?:boolean}
export interface FlowOrigin {testClass:string;data:any;test?:any}
export interface FlowSpec {id:string;match:(origin:FlowOrigin)=>boolean;branches:'targets'|'single'|'targets+self';initialStage:(branch:Branch,origin?:RollRecord)=>string;stages:StageSpec[];originExtract?:string[];cardSections?:string[]}
export interface ReducedStage {outcome?:StageOutcome;derived?:Record<string,number|string|undefined>;stageData?:unknown}
export interface ReduceContext {transactionId:string;branch:Branch;origin:RollRecord;roll:RollRecord;stage:StageSpec;data?:unknown}
export type StageReducer=(context:ReduceContext)=>ReducedStage;
export type OriginExtractor=(origin:FlowOrigin)=>Record<string,unknown>|Promise<Record<string,unknown>>;
export function resolvedTestClasses(stage:StageSpec,origin:RollRecord){return stage.testClasses.map(value=>value==='$origin.defenseTest'?origin.defenseTest:value==='$origin.resistanceTest'?origin.resistanceTest:value).filter((value):value is string=>Boolean(value))}
