#!/bin/bash

echo "📊 REDIS DATA INSPECTION"
echo "========================"
echo ""

echo "🔑 All Keys:"
redis-cli KEYS '*'
echo ""

echo "👤 Sessions:"
redis-cli KEYS 'session:*'
echo ""

echo "🚫 Blacklisted Tokens:"
redis-cli KEYS 'blacklist:*'
echo ""

echo "📧 Verification Codes:"
redis-cli KEYS 'verification:*'
echo ""

echo "⏱️  Rate Limits:"
redis-cli KEYS 'ratelimit:*'
echo ""

echo "📈 Total Keys:"
redis-cli DBSIZE