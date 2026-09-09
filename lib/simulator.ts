export const ASSETS = [
  {symbol:'NVDA',name:'英伟达股票代币',letter:'N',tone:'nvidia'},
  {symbol:'AAPL',name:'苹果股票代币',letter:'A',tone:'apple'},
] as const;
export const SCENARIOS = [
 {id:'sideways',name:'区间内震荡',short:'横盘',description:'价格来回小幅波动，观察手续费累积。'},
 {id:'up',name:'持续上涨',short:'上涨',description:'30 天上涨 50%，观察股票代币逐渐换成 USDG。'},
 {id:'down',name:'持续下跌',short:'下跌',description:'30 天下跌 45%，观察 USDG 逐渐换成股票代币。'},
 {id:'return',name:'先涨后回落',short:'回落',description:'先上涨 50% 再回到起点，观察出区间与重新激活。'},
] as const;
export type Scenario = typeof SCENARIOS[number]['id'];
export type Config = {asset:string;price0:number;lower:number;upper:number;deposit:number;feeRate:number;protocolShare:number;dailyVolume:number;otherActiveLiquidity:number};
export const INITIAL_BALANCE=10000;
export function amounts(L:number,price:number,lower:number,upper:number){
 const a=Math.sqrt(lower),b=Math.sqrt(upper),q=Math.sqrt(Math.max(lower,Math.min(price,upper)));
 return {x:Math.max(0,L*(b-q)/(q*b)),y:Math.max(0,L*(q-a))};
}
export function liquidity(deposit:number,price0:number,lower:number,upper:number){const unit=amounts(1,price0,lower,upper);return deposit/(unit.x*price0+unit.y);}
// The other providers use a fixed, broad reference position. It does not
// change when the learner changes the range of their own position.
export const DEFAULT_CONFIG:Config={asset:'NVDA',price0:100,lower:80,upper:120,deposit:1000,feeRate:.003,protocolShare:1/6,dailyVolume:25000,otherActiveLiquidity:liquidity(100000,100,1,10000)};
export function validateConfig(c:Config,balance=INITIAL_BALANCE):string|null{
 if(!ASSETS.some(a=>a.symbol===c.asset))return '请选择可用的教学资产。';
 const numbers=[c.price0,c.lower,c.upper,c.deposit,c.feeRate,c.protocolShare,c.dailyVolume,c.otherActiveLiquidity];
 if(numbers.some(n=>!Number.isFinite(n)))return '请填写完整、有效的数字。';
 if(c.price0<=0||c.lower<1||c.upper>10000||c.upper<=c.lower||c.upper-c.lower<.01)return '价格下限须小于上限，范围为 $1 至 $10,000。';
 if(c.deposit<10)return '模拟投入至少 $10。';
 if(c.deposit>balance)return '投入金额超过当前虚拟余额。';
 if(![.0005,.003,.01].includes(c.feeRate))return '请选择有效的教学手续费档位。';
 if(c.protocolShare<0||c.protocolShare>1)return '协议抽成须介于 0% 与 100% 之间。';
 if(c.dailyVolume<0||c.dailyVolume>10000000)return '每日模拟成交量须介于 $0 与 $10,000,000 之间。';
 if(c.otherActiveLiquidity<=0)return '其他活跃流动性必须为正数。';
 return null;
}
export function activeFraction(p:number,q:number,lower:number,upper:number){
 if(p===q)return p>=lower&&p<upper?1:0;
 return Math.max(0,Math.min(Math.max(p,q),upper)-Math.max(Math.min(p,q),lower))/Math.abs(q-p);
}
export function priceAt(scenario:Scenario,day:number,price0=100){
 const t=Math.max(0,Math.min(day,30))/30;
 if(scenario==='up')return price0*(1+.5*t);
 if(scenario==='down')return price0*(1-.45*t);
 if(scenario==='return')return price0*(1+.5*(1-Math.abs(2*t-1)));
 return price0*(1+.045*Math.sin(6*Math.PI*t));
}
export type Point={day:number;price:number;x:number;y:number;positionValue:number;holdValue:number;fees:number;totalValue:number;pnl:number;vsHold:number;impermanentLoss:number;activeDays:number;active:boolean;share:number;L:number};
export function simulatePath(c:Config,path:{day:number;price:number}[]):Point[]{
 if(!path.length||path[0].day!==0||path[0].price!==c.price0)throw new Error('价格路径必须从第 0 天与起始价开始。');
 const err=validateConfig(c,Number.MAX_VALUE);if(err)throw new Error(err);
 const L=liquidity(c.deposit,c.price0,c.lower,c.upper),initial=amounts(L,c.price0,c.lower,c.upper),share=L/(L+c.otherActiveLiquidity);
 let fees=0,activeDays=0;
 return path.map((p,i)=>{
  if(!Number.isFinite(p.price)||p.price<=0||!Number.isFinite(p.day)||(i>0&&p.day<=path[i-1].day))throw new Error('价格必须为正数，时间必须递增。');
  if(i){const previous=path[i-1];const dt=(p.day-previous.day)*activeFraction(previous.price,p.price,c.lower,c.upper);activeDays+=dt;fees+=c.dailyVolume*dt*c.feeRate*(1-c.protocolShare)*share;}
  const {x,y}=amounts(L,p.price,c.lower,c.upper),positionValue=x*p.price+y,holdValue=initial.x*p.price+initial.y,totalValue=positionValue+fees;
  return {...p,x,y,positionValue,holdValue,fees,totalValue,pnl:totalValue-c.deposit,vsHold:totalValue-holdValue,impermanentLoss:positionValue-holdValue,activeDays,active:p.price>=c.lower&&p.price<c.upper,share,L};
 });
}
export function simulate(c:Config,scenario:Scenario,day:number){
 const end=Math.max(0,Math.min(30,Math.round(day)));
 return simulatePath(c,Array.from({length:end+1},(_,i)=>({day:i,price:priceAt(scenario,i,c.price0)})));
}
export type Position={config:Config;scenario:Scenario;day:number;closed:boolean;settlement:number|null};
export type LabState={config:Config;balance:number;position:Position|null;view:'setup'|'portfolio'|'learn';step:number;message:string};
export const initialState:LabState={config:{...DEFAULT_CONFIG},balance:INITIAL_BALANCE,position:null,view:'setup',step:0,message:''};
export type Action={type:'configure';patch:Partial<Config>}|{type:'view';view:LabState['view']}|{type:'step';step:number}|{type:'create'}|{type:'scenario';scenario:Scenario}|{type:'day';day:number}|{type:'withdraw'}|{type:'reset'};
export function reducer(state:LabState,action:Action):LabState{
 switch(action.type){
 case 'configure':return {...state,config:{...state.config,...action.patch},message:''};
 case 'view':return {...state,view:action.view,message:''};
 case 'step':return {...state,step:Math.max(0,Math.min(2,Math.round(action.step))),message:''};
 case 'create':{
  if(state.position&&!state.position.closed)return {...state,message:'已有模拟仓位。先取出，再开启新实验。',view:'portfolio'};
  const err=validateConfig(state.config,state.balance);if(err)return {...state,message:err};
  return {...state,balance:state.balance-state.config.deposit,view:'portfolio',message:'模拟仓位已创建。试试推动时间，让交易发生。',position:{config:{...state.config},scenario:'sideways',day:0,closed:false,settlement:null}};
 }
 case 'scenario':return !state.position||state.position.closed||!SCENARIOS.some(s=>s.id===action.scenario)?state:{...state,position:{...state.position,scenario:action.scenario},message:''};
 case 'day':return !state.position||state.position.closed||!Number.isFinite(action.day)?state:{...state,position:{...state.position,day:Math.max(0,Math.min(30,Math.round(action.day)))},message:''};
 case 'withdraw':{
  if(!state.position||state.position.closed)return state;
  const result=simulate(state.position.config,state.position.scenario,state.position.day).at(-1)!;
  return {...state,balance:state.balance+result.totalValue,position:{...state.position,closed:true,settlement:result.totalValue},message:'已模拟取出全部资产与手续费，并按当前教学价格折算回虚拟美元。'};
 }
 case 'reset':return {...initialState,config:{...DEFAULT_CONFIG}};
 }
}
