import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../src/lib/calculator.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {calculateSystem,DEFAULT_ASSUMPTIONS}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const base={propertyType:'residential',monthlyUnits:450,assumptions:DEFAULT_ASSUMPTIONS.residential};
test('rounds required capacity up and caps savings at consumption',()=>{const r=calculateSystem(base);assert.equal(r.recommendedKw,4);assert.equal(r.monthlyGenerationUnits,480);assert.equal(r.indicativeMonthlySaving,3600);});
test('never rounds capacity above available roof area',()=>{const r=calculateSystem({...base,roofAreaSqft:100});assert.equal(r.recommendedKw,1);assert.ok(r.areaNeededSqft<=100);assert.equal(r.areaLimited,true);});
test('zero roof area cannot host capacity',()=>assert.equal(calculateSystem({...base,roofAreaSqft:0}).recommendedKw,0));
test('derives consumption from bill when units absent',()=>{const r=calculateSystem({...base,monthlyUnits:null,monthlyBill:3600});assert.equal(r.targetMonthlyUnits,450);assert.equal(r.unitsDerivedFromBill,true);});
test('rejects negative, infinite and zero-assumption inputs',()=>{assert.equal(calculateSystem({...base,monthlyUnits:Infinity}),null);assert.equal(calculateSystem({...base,monthlyUnits:-1}),null);assert.equal(calculateSystem({...base,assumptions:{...base.assumptions,unitsPerKwPerDay:0}}),null);});

