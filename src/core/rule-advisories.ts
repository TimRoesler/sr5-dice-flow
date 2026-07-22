// Advisory-only rule hints for tests that fall through to the generic flows. Each hint carries a
// GRW page reference and, for interrupts, the initiative cost. Pure and unit-tested; the card only
// renders what this returns, it never mutates anything (SR5 p. references, advisory guardrail).
export interface RuleAdvisory{key:string;page:number;ini?:number}
const CONCEAL_SKILLS=['palming'];
const ADDICTION_KEYWORDS=['addiction','sucht','entzug','withdrawal'];
export function ruleAdvisories(input:{skill?:string;actionType?:string;iniMod?:number;name?:string}):RuleAdvisory[]{
 const out:RuleAdvisory[]=[];const skill=String(input.skill??'').toLowerCase();const name=String(input.name??'').toLowerCase();
 if(CONCEAL_SKILLS.includes(skill))out.push({key:'conceal',page:421});
 if(ADDICTION_KEYWORDS.some(k=>name.includes(k)))out.push({key:'addiction',page:416});
 if(input.actionType==='interrupt'){const ini=Number(input.iniMod);out.push(Number.isFinite(ini)&&ini<0?{key:'interrupt',page:165,ini}:{key:'interrupt',page:165})}
 return out;
}
