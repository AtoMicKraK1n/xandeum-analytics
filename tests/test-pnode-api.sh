#!/bin/bash

echo "Testing Xandeum pNode API endpoints..."
echo "========================================"

# List of pNode IPs
PNODES=(
  "173.212.203.145"
  "173.212.220.65"
  "161.97.97.41"
  "192.190.136.36"
  "192.190.136.37"
  "192.190.136.38"
  "192.190.136.28"
  "192.190.136.29"
  "207.244.255.1"
)

# Test first pNode
PNODE_IP="${PNODES[0]}"
echo ""
echo "Testing pNode: $PNODE_IP"
echo "----------------------------"

# Test 1: get-version
echo ""
echo "1. Testing get-version..."
curl -s -X POST http://$PNODE_IP:6000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"get-version","id":1}' | jq '.'

# Test 2: get-pods (most important!)
echo ""
echo "2. Testing get-pods..."
curl -s -X POST http://$PNODE_IP:6000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"get-pods","id":1}' | jq '.'

# Test 3: get-stats
echo ""
echo "3. Testing get-stats..."
curl -s -X POST http://$PNODE_IP:6000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"get-stats","id":1}' | jq '.'

echo ""
echo "========================================"
echo "Testing complete!"