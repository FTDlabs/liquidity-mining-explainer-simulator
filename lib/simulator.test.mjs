import test from 'node:test';
import assert from 'node:assert/strict';
import {amounts,liquidity,simulate,simulatePath,activeFraction,validateConfig,DEFAULT_CONFIG,initialState,reducer} from './simulator.ts';
const close=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('independent concentrated-liquidity numerical benchmark, including boundary crossings',()=>{
 const c={...DEFAULT_CONFIG,price0:100,lower:64,upper:144,deposit:1000,feeRate:.003,protocolShare:.1,dailyVolume:100000,otherActiveLiquidity:30000/11};
 const rows=simulatePath(c,[100,121,169,196,100,49,100].map((price,day)=>({price,day})));
 close(rows[0].L,3000/11);close(rows[0].x,50/11);close(rows[0].y,6000/11);
 close(rows[1].fees,24.545454545);close(rows[2].fees,36.3068181818);close(rows[3].fees,rows[2].fees);close(rows[4].fees,47.5568181818);close(rows[6].fees,82.2092245989);
 close(rows[1].vsHold,-2.727272727);close(rows[4].positionValue,1000);
 close(activeFraction(49,196,64,144),80/147);close(activeFraction(196,100,64,144),44/96);
});
test('all price regimes preserve amount invariants and the unchanged-asset benchmark',()=>{
 for(const lower of [1,64,80,110])for(const upper of [120,144,200,10000]){
  const c={...DEFAULT_CONFIG,lower,upper};const L=liquidity(c.deposit,100,lower,upper),initial=amounts(L,100,lower,upper);
  close(initial.x*100+initial.y,1000);
  for(const p of [1,30,64,80,100,120,144,250,10000]){
   const a=amounts(L,p,lower,upper);assert.ok(a.x>=0&&a.y>=0);
   if(p<=lower)close(a.y,0);if(p>=upper)close(a.x,0);
   assert.ok(a.x*p+a.y<=initial.x*p+initial.y+1e-6);
   close((a.x+L/Math.sqrt(upper))*(a.y+L*Math.sqrt(lower))/L**2,1);
  }
 }
});
test('zero-volume and zero-LP-fee periods accrue nothing; returning restores original amounts',()=>{
 for(const patch of [{dailyVolume:0},{protocolShare:1}])close(simulate({...DEFAULT_CONFIG,...patch},'return',30).at(-1).fees,0);
 const r=simulate(DEFAULT_CONFIG,'return',30);close(r[0].x,r.at(-1).x);close(r[0].y,r.at(-1).y);assert.ok(r.at(-1).fees>0);
 close(activeFraction(120,130,80,120),0);close(activeFraction(120,120,80,120),0);close(activeFraction(80,80,80,120),1);
});
test('deposit, scenario selection and one-time withdrawal conserve the virtual wallet',()=>{
 let s=reducer(initialState,{type:'create'});close(s.balance,9000);
 s=reducer(s,{type:'scenario',scenario:'down'});s=reducer(s,{type:'day',day:30});
 const end=simulate(s.position.config,'down',30).at(-1);
 s=reducer(s,{type:'withdraw'});close(s.balance,9000+end.totalValue);assert.equal(s.position.closed,true);
 const again=reducer(s,{type:'withdraw'});close(again.balance,s.balance);
 assert.deepEqual(reducer(s,{type:'day',day:0}),s);assert.deepEqual(reducer(s,{type:'scenario',scenario:'up'}),s);
 assert.deepEqual(reducer(s,{type:'reset'}),initialState);
});
test('invalid input cannot create a position or debit the virtual wallet',()=>{
 for(const patch of [{deposit:NaN},{deposit:10001},{lower:0},{lower:120,upper:80},{upper:Infinity},{dailyVolume:-1},{feeRate:.8}]){
  const state={...initialState,config:{...DEFAULT_CONFIG,...patch}};
  assert.ok(validateConfig(state.config));const result=reducer(state,{type:'create'});assert.equal(result.position,null);close(result.balance,10000);
 }
});
