#!/bin/bash
# MezoLens Contract Deployment Script
# Usage: PRIVATE_KEY=your_key_here bash deploy.sh

set -e

export PATH="$HOME/.foundry/bin:$PATH"

if [ -z "$PRIVATE_KEY" ]; then
  echo "ERROR: Set PRIVATE_KEY environment variable"
  echo "Usage: PRIVATE_KEY=0xyour_private_key bash deploy.sh"
  exit 1
fi

echo "=== Deploying MezoLens to Mezo Testnet ==="
echo ""

forge script script/Deploy.s.sol \
  --rpc-url https://rpc.test.mezo.org \
  --broadcast \
  --legacy \
  -vvv

echo ""
echo "=== Deployment complete! ==="
echo "Copy the contract addresses from above and update src/config/contracts.ts"
