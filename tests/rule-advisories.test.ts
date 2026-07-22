import{describe,expect,it}from'vitest';import{ruleAdvisories}from'../src/core/rule-advisories';
describe('rule advisories',()=>{
 it('flags concealment for palming tests',()=>{expect(ruleAdvisories({skill:'palming'})).toEqual([{key:'conceal',page:421}])});
 it('flags addiction from item/action name keywords',()=>{expect(ruleAdvisories({name:'Entzugsprobe'})).toEqual([{key:'addiction',page:416}]);expect(ruleAdvisories({name:'Addiction Test'})).toEqual([{key:'addiction',page:416}])});
 it('adds the initiative cost for interrupt actions',()=>{expect(ruleAdvisories({actionType:'interrupt',iniMod:-5})).toEqual([{key:'interrupt',page:165,ini:-5}])});
 it('omits the cost when no negative ini modifier is present',()=>{expect(ruleAdvisories({actionType:'interrupt'})).toEqual([{key:'interrupt',page:165}]);expect(ruleAdvisories({actionType:'interrupt',iniMod:0})).toEqual([{key:'interrupt',page:165}])});
 it('returns nothing for a plain simple test',()=>{expect(ruleAdvisories({skill:'perception',actionType:'simple'})).toEqual([])});
 it('can report multiple hints at once',()=>{expect(ruleAdvisories({skill:'palming',actionType:'interrupt',iniMod:-5})).toEqual([{key:'conceal',page:421},{key:'interrupt',page:165,ini:-5}])});
});
