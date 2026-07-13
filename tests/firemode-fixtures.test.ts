import{beforeAll,describe,expect,it}from'vitest';import{flows}from'../src/core/flows/registry';import{registerCoreFlowSpecs}from'../src/core/flows/specs';import{combatOriginExtractor}from'../src/foundry/extract';import fixturesJson from'./fixtures/firemodes.json';const fixtures=fixturesJson as any[];
beforeAll(()=>{(globalThis as any).game={i18n:{localize:(key:string)=>key,has:()=>false}};registerCoreFlowSpecs()});
describe('fire mode fixtures',()=>{
 it.each(fixtures)('routes $name to $flow',fixture=>{expect(flows.match({testClass:fixture.data.type,data:fixture.data})?.id).toBe(fixture.flow)});
 it.each(fixtures)('extracts fire mode and pool groups for $name',fixture=>{const result:any=combatOriginExtractor({testClass:fixture.data.type,data:fixture.data});const combat=result.combat;if(fixture.data.fireMode){expect(combat.fireMode).toMatchObject({rounds:fixture.rounds,defense:fixture.defense,suppression:fixture.suppression})}else{expect(combat.fireMode).toBeUndefined()}const groups=Object.entries(combat.poolGroups).filter(([,changes])=>(changes as any[]).length).map(([group])=>group);expect(groups.sort()).toEqual([...fixture.poolGroups].sort());expect(combat.calledShot).toBeUndefined()});
 it('recognises exactly one suppression fixture',()=>{expect(fixtures.filter(fixture=>fixture.flow==='suppression')).toHaveLength(1)});
});
