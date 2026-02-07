# Symbiont 机器端 (Zone A) 快速启动指南

## 📂 项目结构

```
Symbiont/
├── backend/                  # 后端 API 服务 (Next.js + x402)
│   ├── middleware.ts         # x402 支付网关配置
│   ├── app/api/
│   │   ├── upload/route.ts   # 上传解决方案 API
│   │   └── query/route.ts    # 查询解决方案 API (x402 保护)
│   ├── data/db.json          # 解决方案数据库 (预填充 3 条)
│   └── .env.development      # 环境变量
│
└── agent/                    # AI Agent 演示脚本
    ├── agent.ts              # 完整 x402 支付演示流程
    ├── .env.example          # 环境变量模板
    └── package.json
```

## 🚀 快速启动

### 1. 启动后端服务

```powershell
cd backend
npm run dev
```

访问 http://localhost:3000 查看服务状态。

### 2. 配置 Agent 钱包

```powershell
cd agent
cp .env.example .env
# 编辑 .env，填入你的 Base Sepolia 测试网私钥
```

> ⚠️ **重要**: 使用测试网钱包！获取测试 USDC: https://faucet.circle.com/

### 3. 运行 Agent 演示

```powershell
npm run agent
```

演示流程:
1. 模拟编译错误
2. 搜索 Symbiont 网络
3. 收到 402 Payment Required
4. 自动签名 x402 支付
5. 获取并应用解决方案

## 📡 API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/upload` | POST | 上传新的错误解决方案 |
| `/api/upload` | GET | 查看所有解决方案列表 |
| `/api/query?hash=xxx` | GET | 🔒 x402 保护 - 购买解决方案 |

## 🔧 配置说明

### backend/.env.development

```bash
NEXT_PUBLIC_FACILITATOR_URL=https://x402.org/facilitator
NETWORK=eip155:84532          # Base Sepolia 测试网
RESOURCE_WALLET_ADDRESS=0x... # 收款钱包地址 (卖家)
```

### agent/.env

```bash
AGENT_PRIVATE_KEY=0x...       # Agent 钱包私钥 (买家)
API_BASE_URL=http://localhost:3000
```

## 🎤 Demo 演示要点

1. **Zone B** 上传解决方案 → 调用 `POST /api/upload`
2. **Zone A** Agent 运行脚本 → 终端显示支付流程
3. 观众看到: `402 Payment Required` → `Payment Sent` → `Solution Delivered`
4. **Zone B** 钱包余额增加
