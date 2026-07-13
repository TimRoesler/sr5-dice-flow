import{describe,expect,it}from'vitest';import de from'../lang/de.json';import en from'../lang/en.json';
const langs={de,en}as Record<string,Record<string,string>>;
// Foundry expands dotted keys into a nested object tree. A key that is both a leaf
// ("SDF.X") and a branch prefix ("SDF.X.Y") throws during localization load and aborts the world.
function collisions(flat:Record<string,string>){const keys=Object.keys(flat),set=new Set(keys);return keys.filter(key=>[...set].some(other=>other!==key&&other.startsWith(`${key}.`)))}
describe('localization files',()=>{
 for(const[lang,flat]of Object.entries(langs)){
  it(`${lang}: no key is both a leaf and a branch`,()=>{expect(collisions(flat)).toEqual([])});
  it(`${lang}: every value is a non-empty string`,()=>{expect(Object.entries(flat).filter(([,value])=>typeof value!=='string'||value==='').map(([key])=>key)).toEqual([])});
 }
 it('de and en declare the same keys',()=>{expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort())});
});
