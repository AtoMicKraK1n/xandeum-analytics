#!/bin/bash

echo "Testing all pNode IPs for get-pods..."
echo "======================================"

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

for PNODE_IP in "${PNODES[@]}"; do
  echo ""
  echo "Testing: $PNODE_IP"
  echo "-------------------"
  
  # Test get-pods
  RESPONSE=$(curl -s --max-time 5 -X POST http://$PNODE_IP:6000/rpc \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"get-pods","id":1}')
  
  if [ $? -eq 0 ]; then
    TOTAL_COUNT=$(echo $RESPONSE | jq -r '.result.total_count')
    echo "✓ Connected - Total pNodes: $TOTAL_COUNT"
    
    if [ "$TOTAL_COUNT" != "0" ] && [ "$TOTAL_COUNT" != "null" ]; then
      echo "🎉 FOUND PODS! Full response:"
      echo $RESPONSE | jq '.'
    fi
  else
    echo "✗ Connection failed"
  fi
done

echo ""
echo "======================================"
echo "Testing complete!"