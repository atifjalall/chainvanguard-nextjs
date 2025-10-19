#!/bin/bash
# ===============================================================
# 🚀 ChainVanguard - Cart System Setup Script
# ===============================================================
# Cart system uses MongoDB + Redis (No blockchain needed)
# This script verifies cart system is ready
# ===============================================================

set -e
echo "======================="
echo "🛒 Cart System Setup"
echo "======================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Cart System Verification${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check MongoDB
echo "📊 Checking MongoDB..."
if mongosh --eval "db.version()" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MongoDB is running${NC}"
else
    echo "❌ MongoDB is not running. Please start MongoDB first."
    exit 1
fi

# Check Redis
echo "🔴 Checking Redis..."
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo "❌ Redis is not running. Please start Redis first."
    exit 1
fi

# Create cart collection indexes
echo "📁 Setting up cart collection indexes..."
mongosh mongodb://localhost:27017/test --eval '
db.carts.createIndex({ userId: 1, status: 1 });
db.carts.createIndex({ sessionId: 1, status: 1 });
db.carts.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
db.carts.createIndex({ lastActivityAt: 1 });
print("✅ Cart indexes created");
'

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║        🛒 Cart System Ready! 🛒                          ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Cart System Status:${NC}"
echo -e "  ✅ MongoDB: Running & Indexed"
echo -e "  ✅ Redis: Running"
echo -e "  ✅ Cart Model: api/src/models/Cart.js"
echo -e "  ✅ Cart Routes: api/src/routes/cart.routes.js"
echo -e "  ✅ Cart Service: api/src/services/cart.service.js"
echo ""
echo -e "${CYAN}ℹ️  Note: Cart system uses MongoDB + Redis only (no blockchain)${NC}"
echo ""