#!/bin/bash
# MezoLens On-Chain Integration Test Script
# Usage: PRIVATE_KEY=0x... bash scripts/test-onchain.sh

set -e
export PATH="$HOME/.foundry/bin:$PATH"

VAULT=0x961E1fc557c6A5Cf70070215190f9B57F719701D
RPC=https://rpc.test.mezo.org
PASS=0
FAIL=0

if [ -z "$PRIVATE_KEY" ]; then
  echo "ERROR: Set PRIVATE_KEY environment variable"
  exit 1
fi

ADDR=$(cast wallet address "$PRIVATE_KEY" 2>/dev/null)
echo "=== MezoLens On-Chain Test Suite ==="
echo "Vault:   $VAULT"
echo "Wallet:  $ADDR"
echo ""

test_send() {
  local name=$1; shift
  echo -n "  $name... "
  if cast send $VAULT "$@" --rpc-url $RPC --private-key $PRIVATE_KEY --legacy 2>&1 | grep -q "status               1"; then
    echo "PASS"; PASS=$((PASS + 1))
  else
    echo "FAIL"; FAIL=$((FAIL + 1))
  fi
}

test_call() {
  local name=$1; shift
  echo -n "  $name... "
  if cast call $VAULT "$@" --rpc-url $RPC > /dev/null 2>&1; then
    echo "PASS"; PASS=$((PASS + 1))
  else
    echo "FAIL"; FAIL=$((FAIL + 1))
  fi
}

test_revert() {
  local name=$1; shift
  echo -n "  $name... "
  if cast call $VAULT "$@" --from $ADDR --rpc-url $RPC 2>&1 | grep -q "reverted"; then
    echo "PASS (reverts)"; PASS=$((PASS + 1))
  else
    echo "FAIL (should revert)"; FAIL=$((FAIL + 1))
  fi
}

echo "[Deposits]"
test_send "Conservative" "deposit(uint8,uint256)" 0 0 --value 0.000001ether
test_send "Balanced" "deposit(uint8,uint256)" 1 0 --value 0.000001ether
test_send "Aggressive" "deposit(uint8,uint256)" 2 0 --value 0.000001ether

echo ""
echo "[Read Functions]"
test_call "getVaultStats" "getVaultStats()"
test_call "getUserPositionIds" "getUserPositionIds(address)" "$ADDR"
test_call "getPosition(0)" "getPosition(uint256)" 0
test_call "getCurrentEpoch" "getCurrentEpoch()"
test_call "getPendingCompound(0)" "getPendingCompound(uint256)" 0
test_call "getEstimatedAPR(Conservative)" "getEstimatedAPR(uint8)" 0
test_call "getEstimatedAPR(Balanced)" "getEstimatedAPR(uint8)" 1
test_call "getEstimatedAPR(Aggressive)" "getEstimatedAPR(uint8)" 2
test_call "getCompoundHistory(0)" "getCompoundHistory(uint256)" 0

echo ""
echo "[Expected Reverts]"
test_revert "compound(NoNewEpoch)" "compound(uint256)" 0
test_revert "withdraw(LockNotExpired)" "withdraw(uint256)" 0

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ $FAIL -eq 0 ] && echo "ALL TESTS PASSED" || echo "SOME TESTS FAILED"
exit $FAIL
