# 流动性挖矿机制讲解及模拟

面向零基础用户的中文交互式教学网站。通过虚拟资金，体验选择资产、设置价格区间、提供流动性、查看收益和取出资产的过程。界面参考 Uniswap，页面内称为「流动性实验室」。

本项目演示集中流动性的交易手续费机制，不模拟额外的挖矿奖励或真实交易。

## 体验内容

- 以 NVDA / USDG、AAPL / USDG 为教学币对，模拟 Robinhood Chain 场景。
- 配置价格区间、投入金额、手续费档位、协议抽成与每日成交量。
- 切换区间内震荡、持续上涨、持续下跌、先涨后回落四种行情。
- 对比手续费、仓位价值、总盈亏与原样持有的结果。
- 观察出区间后的单边资产状态，以及回到区间后的恢复。
- 使用虚拟钱包存入、取出、重置实验，并通过机制问答与小测学习。

所有价格、成交量和收益均为教学设定。无需钱包，不发起链上交易；模拟结果不代表实际收益。此项目独立于 Uniswap 与 Robinhood。

## 本地运行

需要 Node.js 22.13 或以上版本。

```sh
npm ci
npm run dev
```

打开启动输出中的本地地址。实验状态仅保留在当前页面，刷新会重置。

```sh
npm test
npm run build
```

测试覆盖集中流动性数学、跨区间计费、零成交量、持有基准、虚拟余额结算和无效输入。

## 项目结构

- `app/page.tsx`：教学界面、操作流程与页面交互接口。
- `app/globals.css`：响应式样式。
- `lib/simulator.ts`：集中流动性计算、行情情景与虚拟账户状态。
- `lib/simulator.test.mjs`：数值基准与账户行为测试。
- `.openai/hosting.json`：已有 Sites 项目的部署关联，不含凭据。

使用 React、TypeScript、Vinext、Vite、Tailwind CSS 与 shadcn 组件。原有构建输出兼容 Cloudflare Workers。

## Vercel 部署

将仓库导入 Vercel 即可使用 `vercel.json` 中的配置部署。Vercel 执行 `npm run build:vercel`，将 `dist-vercel` 作为静态网站发布；无需数据库、钱包或环境变量。原有 Sites 构建与部署配置保持可用。

## 计算口径

采用 Uniswap v3 集中流动性数学，根据区间与初始投入计算两种资产数量，不固定为 50/50。模拟手续费按区间内成交量、LP 有效费率与活跃流动性份额计算；跨边界按日内线性路径与均匀成交量划分。

手续费按获得时美元价值单独累计，不自动复投。USDG 假设为 1 美元，不计 Gas、兑换、滑点、税费、分红与拆股。页面可展开完整假设。

## 学习来源

- [Uniswap × Robinhood Chain](https://blog.uniswap.org/robinhood-chain-is-live)
- [Uniswap 集中流动性](https://developers.uniswap.org/docs/get-started/concepts/liquidity-providers/concentrated-liquidity)
- [Uniswap 手续费机制](https://developers.uniswap.org/docs/get-started/concepts/fees)
- [Uniswap v3 仓位数学](https://blog.uniswap.org/uniswap-v3-math-primer-2)
- [Robinhood 股票代币说明](https://robinhood.com/rhj/stocktokens/)
- [用户提供的学习视频](https://www.youtube.com/watch?v=UhIvDWY3pCA&t=4s)：视频具体参数尚未核实，未作为默认参数的依据。
