# YelloStone-gRPC-Solana-Indexer

🚀 **An advanced, production-ready blockchain indexer for Solana** with real-time multi-token tracking, intelligent alerting, and comprehensive performance monitoring. Built with TypeScript and designed for enterprise-scale blockchain data processing.

---

## 🎯 What This Project Does

This project connects to Yellowstone gRPC streams and provides real-time Solana blockchain indexing with advanced features:

### 🔍 **Data Tracking**
- **Multi-token account updates** (USDC, USDT, SOL, BONK, JUP)
- **Transaction monitoring** with success/failure tracking
- **Slot progression** and network health monitoring
- **Block updates** with comprehensive metadata
- **Whale movement detection** with configurable thresholds

### 🚨 **Intelligent Alerting**
- **Discord notifications** with rich embeds and token-specific styling
- **Telegram bot integration** with formatted messages and explorer links
- **Custom webhooks** for integration with external systems
- **Configurable thresholds** per token for targeted alerts

### 📊 **Performance Excellence**
- **Real-time metrics** tracking messages/second, latency, and throughput
- **Health monitoring** with automatic issue detection
- **Resource optimization** with memory and CPU tracking
- **Database performance** monitoring with query optimization insights

---

## 🚀 Quick Start

### 1. **Clone and Install**
```bash
git clone https://github.com/Shradhesh71/YelloStone-gRPC.git
cd YelloStone-gRPC
npm install
```

### 2. **Environment Configuration**
Create a `.env` file with your settings:
```env
# Yellowstone gRPC Configuration
ENDPOINT=https://grpc.solana.com
TOKEN="your_yellowstone_token"

# Database Configuration (Optional)
DATABASE_URL="postgresql://user:password@localhost:5432/solana_indexer"

# Discord Alerts (Optional)
DISCORD_WEBHOOK_ENABLED=true
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK"

# Telegram Alerts (Optional)
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_CHAT_ID="your_chat_id"
```

### 3. **Database Setup**
```bash
# Generate Prisma client and setup database
npx prisma generate
npx prisma db push
```

### 4. **Launch the Indexer**
```bash
npm run dev
```

🎉 **You'll see real-time monitoring, token tracking, and alerts!**

---

## ⚙️ Advanced Configuration

### 🪙 **Adding New Tokens**
Edit `src/config/tokens.ts`:
```typescript
PYTH: {
  mintAddress: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
  symbol: "PYTH",
  name: "Pyth Network", 
  decimals: 6,
  enabled: true,
  alertThreshold: 5000  // Alert for 5k+ PYTH transfers
}
```

### 🚨 **Customizing Alert Thresholds**
```typescript
// Modify in src/config/tokens.ts
USDC: {
  alertThreshold: 50000  // Increase to $50k for fewer alerts
}
```

### 📊 **Performance Tuning**
```typescript
// Adjust in src/monitoring/types.ts
PERFORMANCE_THRESHOLDS = {
  MAX_PROCESSING_TIME: 500,    // Lower for faster alerts
  MAX_DATABASE_LATENCY: 200,   // Optimize database performance
  MAX_MEMORY_USAGE: 1024 * 1024 * 1024  // 1GB memory limit
}
```

### 🔧 **Subscription Modes**
Switch between different tracking modes in `src/index.ts`:
```typescript
// Main: Multi-token tracking (recommended)
const request = createSubscribeRequest();

// Account-only: Just account updates
// const request = createAccountOnlySubscription();

// Token Program: All token program accounts  
// const request = createTokenProgramSubscription();
```

---

## 🔧 Technical Architecture

### **Core Components**
```
📁 src/
├── 🎛️  config/          # Token configuration & environment setup
├── 🔗 grpc/            # Yellowstone gRPC client & subscriptions  
├── ⚡ processing/       # Data handling with performance monitoring
├── 🚨 alerts/          # Multi-channel notification system
├── 📊 monitoring/      # Performance tracking & health checks
└── 🧪 testing/         # Comprehensive test suites
```

### **Data Flow**
```
Yellowstone gRPC → Token Filter → Performance Monitor → Database → Alert Engine
```

### **Performance Monitoring**
- **Throughput**: Messages per second tracking
- **Latency**: Processing time measurement  
- **Resources**: Memory and CPU monitoring
- **Health**: Automatic issue detection
- **Alerts**: Performance degradation warnings

---

## 🤝 Contributing

We welcome contributions! Please:

1. 🍴 Fork the repository
2. 🌟 Create a feature branch
3. ✅ Add tests for new features
4. 📝 Update documentation
5. 🔄 Submit a pull request
---

## 👨‍💻 Author & Support

**Maintained by [@Shradhesh71](https://github.com/Shradhesh71)**

🐛 **Found a bug?** [Open an issue](https://github.com/Shradhesh71/YelloStone-gRPC-Solana-indexer/issues)  
💡 **Feature request?** [Start a discussion](https://github.com/Shradhesh71/YelloStone-gRPC-Solana-indexer/discussions)  
📧 **Need help?** Check our documentation or open an issue

---

**Built with ❤️ for the Solana ecosystem**
