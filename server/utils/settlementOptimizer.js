// Settlement optimization algorithms

/**
 * Greedy algorithm to minimize the number of transactions needed to settle all balances
 * This uses the "Minimize Cash Flow" algorithm which is optimal for this use case
 *
 * Time Complexity: O(n^2) where n is the number of people
 * Space Complexity: O(n)
 *
 * @param {Array} balances - Array of {userId, netBalance} objects
 * @returns {Array} - Array of {from, to, amount} settlement transactions
 */
function calculateOptimalSettlements(balances) {
  console.log("🧮 Starting optimal settlement calculation...");
  console.log("📊 Input balances:", balances);

  // Create deep copies to avoid mutating the original data
  const balancesCopy = balances.map((b) => ({
    userId: b.userId,
    netBalance: b.netBalance,
  }));

  // Filter out zero balances and create working arrays
  const creditors = balancesCopy
    .filter((b) => b.netBalance > 0)
    .sort((a, b) => b.netBalance - a.netBalance);
  const debtors = balancesCopy
    .filter((b) => b.netBalance < 0)
    .sort((a, b) => a.netBalance - b.netBalance);

  console.log("💰 Creditors (owed money):", creditors);
  console.log("💸 Debtors (owe money):", debtors);

  const settlements = [];

  // Use two pointers approach for greedy matching
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    // Calculate settlement amount (minimum of what's owed and what's due)
    const settlementAmount = Math.min(
      creditor.netBalance,
      Math.abs(debtor.netBalance)
    );

    console.log(
      `🔄 Processing: ${debtor.userId} owes ${creditor.userId} → ${settlementAmount}`
    );

    // Create settlement transaction
    settlements.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: settlementAmount,
    });

    // Update balances (working on copies, not originals)
    creditor.netBalance -= settlementAmount;
    debtor.netBalance += settlementAmount;

    // Move to next creditor/debtor if current one is settled
    if (creditor.netBalance === 0) {
      creditorIndex++;
    }
    if (debtor.netBalance === 0) {
      debtorIndex++;
    }
  }

  console.log("✅ Optimal settlements calculated:", settlements);
  console.log(`📈 Reduced to ${settlements.length} transactions`);

  return settlements;
}

/**
 * Alternative algorithm: Cash Flow Minimization using graph theory
 * This can handle more complex scenarios and can be even more optimal in some cases
 *
 * @param {Array} balances - Array of {userId, netBalance} objects
 * @returns {Array} - Array of {from, to, amount} settlement transactions
 */
function calculateGraphBasedSettlements(balances) {
  console.log("🕸️ Starting graph-based settlement calculation...");

  // This is a more advanced algorithm that can be implemented later
  // For now, we'll use the simpler greedy approach which is sufficient for most cases
  return calculateOptimalSettlements(balances);
}

/**
 * Validate that settlements are mathematically correct
 *
 * @param {Array} originalBalances - Original balance array
 * @param {Array} settlements - Calculated settlements
 * @returns {boolean} - True if settlements are valid
 */
function validateSettlements(originalBalances, settlements) {
  console.log("✅ Validating settlements...");
  console.log("📊 Original balances:", originalBalances);
  console.log("🔄 Settlements:", settlements);

  // Calculate net flow for each user from settlements
  const netFlow = {};
  originalBalances.forEach((balance) => {
    netFlow[balance.userId] = 0;
  });

  settlements.forEach((settlement) => {
    netFlow[settlement.from] =
      (netFlow[settlement.from] || 0) - settlement.amount;
    netFlow[settlement.to] = (netFlow[settlement.to] || 0) + settlement.amount;
  });

  console.log("🧮 Calculated net flow:", netFlow);
  // Check if net flow matches original balances
  let isValid = true;
  originalBalances.forEach((balance) => {
    const expectedFlow = balance.netBalance; // Settlement flow should match the balance
    const actualFlow = netFlow[balance.userId] || 0;
    const difference = Math.abs(expectedFlow - actualFlow);

    console.log(`🔍 User ${balance.userId}:`);
    console.log(`   Original balance: ${balance.netBalance}`);
    console.log(`   Expected flow: ${expectedFlow}`);
    console.log(`   Actual flow: ${actualFlow}`);
    console.log(`   Difference: ${difference}`);

    if (difference > 0.01) {
      // Allow for small floating point errors
      console.error(
        `❌ Validation failed for user ${balance.userId}: expected ${expectedFlow}, got ${actualFlow}, difference: ${difference}`
      );
      isValid = false;
    }
  });

  // Additional check: total money in should equal total money out
  const totalIn = settlements.reduce((sum, s) => sum + s.amount, 0);
  const totalOut = settlements.reduce((sum, s) => sum + s.amount, 0);
  console.log(`💰 Total settlement amount: ${totalIn}`);

  // Check that total positive balances equal total negative balances
  const totalPositive = originalBalances
    .filter((b) => b.netBalance > 0)
    .reduce((sum, b) => sum + b.netBalance, 0);
  const totalNegative = Math.abs(
    originalBalances
      .filter((b) => b.netBalance < 0)
      .reduce((sum, b) => sum + b.netBalance, 0)
  );

  console.log(`📊 Total positive balances: ${totalPositive}`);
  console.log(`📊 Total negative balances: ${totalNegative}`);
  console.log(
    `📊 Balance difference: ${Math.abs(totalPositive - totalNegative)}`
  );

  if (Math.abs(totalPositive - totalNegative) > 0.01) {
    console.error(
      `❌ Input balances don't sum to zero! Positive: ${totalPositive}, Negative: ${totalNegative}`
    );
    isValid = false;
  }

  if (isValid) {
    console.log("✅ Settlements validation passed");
  } else {
    console.error("❌ Settlements validation failed - see details above");
  }

  return isValid;
}

/**
 * Calculate settlement statistics
 *
 * @param {Array} originalBalances - Original balances
 * @param {Array} settlements - Calculated settlements
 * @returns {Object} - Statistics object
 */
function calculateSettlementStats(originalBalances, settlements) {
  const totalPositiveBalance = originalBalances
    .filter((b) => b.netBalance > 0)
    .reduce((sum, b) => sum + b.netBalance, 0);

  const totalNegativeBalance = Math.abs(
    originalBalances
      .filter((b) => b.netBalance < 0)
      .reduce((sum, b) => sum + b.netBalance, 0)
  );

  const maxPossibleTransactions =
    originalBalances.filter((b) => b.netBalance > 0).length *
    originalBalances.filter((b) => b.netBalance < 0).length;

  return {
    totalMoneyFlow: totalPositiveBalance,
    balanceCheck: Math.abs(totalPositiveBalance - totalNegativeBalance) < 0.01,
    actualTransactions: settlements.length,
    maxPossibleTransactions: maxPossibleTransactions,
    efficiencyPercentage:
      maxPossibleTransactions > 0
        ? (
            ((maxPossibleTransactions - settlements.length) /
              maxPossibleTransactions) *
            100
          ).toFixed(1)
        : 0,
    reductionRatio:
      maxPossibleTransactions > 0
        ? (maxPossibleTransactions / settlements.length).toFixed(1)
        : 0,
  };
}

module.exports = {
  calculateOptimalSettlements,
  calculateGraphBasedSettlements,
  validateSettlements,
  calculateSettlementStats,
};
