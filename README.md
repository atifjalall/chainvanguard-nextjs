# 🚀 ChainVanguard - Blockchain Supply Chain Management

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)
![Hyperledger Fabric](https://img.shields.io/badge/Hyperledger_Fabric-2.2.20-red?style=for-the-badge&logo=hyperledger)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)

**Blockchain as the Backbone of Futuristic Supply Chain**

</div>

---

## 📋 Overview

ChainVanguard is a blockchain-based supply chain management system for Pakistan's textile industry, built on **Hyperledger Fabric**. It provides transparency, traceability, and trust through decentralized technology, addressing challenges like counterfeiting, inefficiencies, and lack of transparency.

### Key Features
- 🔐 **Hyperledger Fabric** - Permissioned blockchain network
- 💾 **IPFS Storage** - Decentralized file storage
- 🔑 **MetaMask Integration** - Wallet-based authentication
- 📊 **Real-time Tracking** - Complete supply chain visibility
- 👥 **4 User Roles** - Supplier, Vendor, Customer, BDLT Expert

---

## 🎯 Problem Statement

Pakistan's textile industry faces:
- Lack of transparency in supply chain
- Counterfeit goods and fraud
- Inefficient manual processes
- Trust deficit among stakeholders
- Data integrity issues

---

## 👥 User Roles

| Role | Access | Key Features |
|------|--------|--------------|
| **Supplier/Ministry** | Read & Write | Manage inventory, buy/sell, full product history |
| **Vendor** | Write | Add products, manage sales |
| **Customer** | Read Only | Browse, purchase, track orders |
| **BDLT Expert** | Admin | Monitor system, manage consensus, security |

---

## 🛠️ Tech Stack

### Frontend
- Next.js 15.4.6 (App Router)
- React 19.1.0
- TypeScript 5.x
- Tailwind CSS 4.x
- shadcn/ui

### Blockchain & Web3
- Hyperledger Fabric 2.2.20
- IPFS (ipfs-http-client 60.0.1)
- Web3.js 4.16.0
- Ethers.js 6.15.0
- MetaMask Integration

### Backend (To be implemented)
- Go (Chaincode)
- Node.js 18.x+
- Docker

---

## 📦 Installation

### Prerequisites
```bash
Node.js 18.x+
npm 9.x+
Git
Docker
MetaMask Browser Extension
```

### Setup

1. **Clone Repository**
```bash
git clone https://github.com/yourusername/chainvanguard.git
cd chainvanguard
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Variables**
Create `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_HYPERLEDGER_ENDPOINT=http://localhost:7051
NEXT_PUBLIC_IPFS_API_URL=http://localhost:5001
NEXTAUTH_SECRET=your-secret-key
```

4. **Run Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔧 Backend Implementation (Next Steps)

### 1. Hyperledger Fabric Network Setup
```bash
# Generate crypto materials
cryptogen generate --config=./crypto-config.yaml

# Create channel
configtxgen -profile SupplyChainChannel -outputCreateChannelTx ./channel.tx
```

### 2. Smart Contracts (Chaincode)

**Key Functions:**
- `TextileSCM()` - Register products and users
- `addInfo()` - Add transactions
- `updateInfo()` - Update records (51% consensus)
- `logsPre()` - Maintain audit logs

### 3. IPFS Integration
```typescript
// Upload product images
const ipfsHash = await ipfs.add(file);
// Store hash on blockchain
await contract.submitTransaction('TextileSCM', productId, ipfsHash);
```

---

## 🎯 Expected Outcomes

- ✅ Fully functional blockchain-based DApp
- ✅ Real-time product tracking
- ✅ Fraud prevention through immutable records
- ✅ Enhanced supply chain transparency
- ✅ Cost reduction via automation

---

<div align="center">

**Built with ❤️ using Blockchain Technology**

![Blockchain](https://img.shields.io/badge/Blockchain-Hyperledger_Fabric-red?style=flat-square)

</div>
