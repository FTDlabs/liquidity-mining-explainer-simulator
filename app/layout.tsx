import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'流动性实验室 · 用虚拟资金学懂 Uniswap',description:'模拟选择资产、设置价格区间、提供流动性，观察手续费、资产变化与无常损失。无需钱包，无真实交易。'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
