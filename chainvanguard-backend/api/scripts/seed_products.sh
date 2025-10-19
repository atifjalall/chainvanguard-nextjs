#!/bin/bash

echo "🌱 ChainVanguard Product Seeder"
echo "==============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Run the seeder
node --experimental-modules ./seed_products.js