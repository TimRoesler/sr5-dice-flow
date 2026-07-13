import type{FlowSpec}from'../core/flows/spec';import type{Transaction}from'../types';
export interface CardSectionContext {transaction:Transaction;spec:FlowSpec;escape:(value:unknown)=>string;localize:(key:string)=>string}
export type CardSectionRenderer=(context:CardSectionContext)=>string;
export class CardSectionRegistry{private sections=new Map<string,CardSectionRenderer>();register(id:string,renderer:CardSectionRenderer){if(this.sections.has(id))throw new Error(`Card section already registered: ${id}`);this.sections.set(id,renderer);return()=>this.sections.delete(id)}get(id:string){const renderer=this.sections.get(id);if(!renderer)throw new Error(`Unknown card section: ${id}`);return renderer}has(id:string){return this.sections.has(id)}}
export const cardSections=new CardSectionRegistry();
