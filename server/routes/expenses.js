const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../utils/supabaseClient');
const authenticateToken = require('../middleware/authenticateToken');

// Helper function to calculate equal split with proper rounding
function calculateEqualSplit(amount, participantCount) {
  const totalCents = Math.round(amount * 100);
  const baseCents = Math.floor(totalCents / participantCount);
  const remainder = totalCents % participantCount;
  
  const splits = [];
  for (let i = 0; i < participantCount; i++) {
    const extraCent = i < remainder ? 1 : 0;
    splits.push((baseCents + extraCent) / 100);
  }
  
  return splits;
}

// Helper function to update settlement balances
async function updateSettlements(groupId, expenseId, payerId, participants) {
  try {
    console.log('🔄 Updating settlements for expense:', expenseId);
    
    // Get existing settlements for this group
    const { data: existingSettlements, error: settlementsError } = await supabaseAdmin
      .from('expense_settlements')
      .select('*')
      .eq('group_id', groupId);
      
    if (settlementsError) {
      console.error('❌ Error fetching settlements:', settlementsError);
      return;
    }
    
    // Create settlement updates
    const settlementMap = {};
    
    // Initialize existing settlements
    existingSettlements?.forEach(settlement => {
      const key = `${settlement.debtor_id}-${settlement.creditor_id}`;
      settlementMap[key] = settlement.amount;
    });
    
    // Process each participant
    participants.forEach(participant => {
      if (participant.participant_id !== payerId) {
        // This participant owes money to the payer
        const key = `${participant.participant_id}-${payerId}`;
        const reverseKey = `${payerId}-${participant.participant_id}`;
        
        if (settlementMap[reverseKey]) {
          // Payer owes this participant, reduce that amount
          settlementMap[reverseKey] = (settlementMap[reverseKey] || 0) - participant.share_amount;
          if (settlementMap[reverseKey] <= 0) {
            if (settlementMap[reverseKey] < 0) {
              settlementMap[key] = Math.abs(settlementMap[reverseKey]);
            }
            delete settlementMap[reverseKey];
          }
        } else {
          // Increase amount this participant owes payer
          settlementMap[key] = (settlementMap[key] || 0) + participant.share_amount;
        }
      }
    });
    
    // Update settlements in database
    const upsertPromises = Object.entries(settlementMap).map(([key, amount]) => {
      const [debtorId, creditorId] = key.split('-');
      
      return supabaseAdmin
        .from('expense_settlements')
        .upsert({
          group_id: groupId,
          debtor_id: debtorId,
          creditor_id: creditorId,
          amount: amount,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'group_id,debtor_id,creditor_id' 
        });
    });
    
    await Promise.all(upsertPromises);
    console.log('✅ Settlements updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating settlements:', error);
  }
}

// Add new expense to group
router.post('/groups/:groupId/expenses', authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const groupId = req.params.groupId;
  const { amount, description, payerId, participantIds, category = 'general' } = req.body;
  
  console.log('💰 Adding expense to group:', {
    groupId,
    amount,
    description,
    payerId,
    participantIds,
    userId
  });
  
  if (!amount || !description || !payerId || !participantIds || !Array.isArray(participantIds)) {
    return res.status(400).json({ 
      error: 'Amount, description, payer, and participants are required' 
    });
  }
  
  if (participantIds.length === 0) {
    return res.status(400).json({ error: 'At least one participant is required' });
  }
  
  try {
    // Verify user is a member of the group
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();
      
    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Access denied to this group' });
    }
    
    // Verify payer and all participants are group members
    const { data: groupMembers, error: membersError } = await supabaseAdmin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);
      
    if (membersError) {
      return res.status(400).json({ error: 'Failed to verify group members' });
    }
    
    const memberIds = groupMembers.map(m => m.user_id);
    const allParticipants = [...participantIds, payerId];
    const invalidParticipants = allParticipants.filter(id => !memberIds.includes(id));
    
    if (invalidParticipants.length > 0) {
      return res.status(400).json({ 
        error: 'Some participants are not members of this group' 
      });
    }
    
    // Calculate equal splits
    const splitAmounts = calculateEqualSplit(parseFloat(amount), participantIds.length);
    
    // Create the expense record
    const { data: expense, error: expenseError } = await supabaseAdmin
      .from('group_expenses')
      .insert([{
        group_id: groupId,
        payer_id: payerId,
        amount: parseFloat(amount),
        description: description.trim(),
        category,
        created_by: userId
      }])
      .select()
      .single();
      
    if (expenseError) {
      console.error('❌ Expense creation error:', expenseError);
      return res.status(400).json({ error: 'Failed to create expense' });
    }
    
    // Create participant records
    const participantRecords = participantIds.map((participantId, index) => ({
      expense_id: expense.id,
      participant_id: participantId,
      share_amount: splitAmounts[index]
    }));
    
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from('expense_participants')
      .insert(participantRecords)
      .select();
      
    if (participantsError) {
      console.error('❌ Participants creation error:', participantsError);
      return res.status(400).json({ error: 'Failed to add participants' });
    }
    
    // Update settlement balances
    await updateSettlements(groupId, expense.id, payerId, participants);
    
    console.log('✅ Expense created successfully');
    res.json({
      message: 'Expense added successfully',
      expense: expense,
      participants: participants
    });
    
  } catch (err) {
    console.error('❌ Error adding expense:', err);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// Get all expenses for a group
router.get('/groups/:groupId/expenses', authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const groupId = req.params.groupId;
  const { limit = 50, offset = 0 } = req.query;
  
  console.log('📋 Fetching expenses for group:', groupId);
  
  try {
    // Verify user is a member of the group
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();
      
    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Access denied to this group' });
    }
    
    // Get expenses with participant details
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from('group_expenses')
      .select(`
        *,
        expense_participants (
          participant_id,
          share_amount
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      
    if (expensesError) {
      console.error('❌ Expenses query error:', expensesError);
      return res.status(400).json({ error: 'Failed to fetch expenses' });
    }
    
    // Get all unique user IDs involved in expenses
    const userIds = new Set();
    expenses.forEach(expense => {
      userIds.add(expense.payer_id);
      userIds.add(expense.created_by);
      expense.expense_participants.forEach(p => userIds.add(p.participant_id));
    });
    
    // Fetch user details
    const { data: userDetails, error: userDetailsError } = await supabaseAdmin
      .from('details')
      .select('id, full_name, profile_pic')
      .in('id', Array.from(userIds));
      
    if (userDetailsError) {
      console.warn('⚠️ Failed to fetch user details:', userDetailsError);
    }
    
    // Create user lookup map
    const userMap = {};
    userDetails?.forEach(user => {
      userMap[user.id] = user;
    });
    
    // Enrich expenses with user details
    const enrichedExpenses = expenses.map(expense => ({
      ...expense,
      payer: userMap[expense.payer_id] || null,
      created_by_user: userMap[expense.created_by] || null,
      participants: expense.expense_participants.map(p => ({
        ...p,
        user: userMap[p.participant_id] || null
      }))
    }));
    
    console.log('✅ Found expenses:', enrichedExpenses.length);
    res.json({ data: enrichedExpenses });
    
  } catch (err) {
    console.error('❌ Error fetching expenses:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get group member balances
router.get('/groups/:groupId/balances', authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const groupId = req.params.groupId;
  
  console.log('💰 Fetching balances for group:', groupId);
  
  try {
    // Verify user is a member of the group
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();
      
    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Access denied to this group' });
    }
    
    // Get current settlements
    const { data: settlements, error: settlementsError } = await supabaseAdmin
      .from('expense_settlements')
      .select('*')
      .eq('group_id', groupId);
      
    if (settlementsError) {
      console.error('❌ Settlements query error:', settlementsError);
      return res.status(400).json({ error: 'Failed to fetch balances' });
    }
      // Get group members (using manual join since FK relationship may not be defined)
    const { data: groupMembers, error: membersError } = await supabaseAdmin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);
      
    if (membersError) {
      return res.status(400).json({ error: 'Failed to fetch group members' });
    }
    
    // Get user details for all members
    let members = [];
    if (groupMembers.length > 0) {
      const userIds = groupMembers.map(m => m.user_id);
      const { data: userDetails, error: userDetailsError } = await supabaseAdmin
        .from('details')
        .select('id, full_name, profile_pic')
        .in('id', userIds);
        
      if (userDetailsError) {
        return res.status(400).json({ error: 'Failed to fetch user details' });
      }
      
      // Combine group member data with user details
      members = groupMembers.map(member => ({
        user_id: member.user_id,
        details: userDetails.find(d => d.id === member.user_id)
      }));
    }
      // Calculate net balances for each member
    const memberBalances = {};
    members.forEach(member => {
      memberBalances[member.user_id] = {
        user: member.details,
        net_balance: 0,
        owes: [],
        owed_by: []
      };
    });
    
    // Process settlements
    settlements.forEach(settlement => {
      if (settlement.amount > 0) {
        // Debtor owes money to creditor
        memberBalances[settlement.debtor_id].net_balance -= settlement.amount;
        memberBalances[settlement.creditor_id].net_balance += settlement.amount;
        
        memberBalances[settlement.debtor_id].owes.push({
          user: memberBalances[settlement.creditor_id].user,
          amount: settlement.amount
        });
        
        memberBalances[settlement.creditor_id].owed_by.push({
          user: memberBalances[settlement.debtor_id].user,
          amount: settlement.amount
        });
      }
    });
    
    console.log('✅ Balances calculated successfully');
    res.json({ data: Object.values(memberBalances) });
    
  } catch (err) {
    console.error('❌ Error fetching balances:', err);
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

// Update expense (recalculate splits)
router.put('/expenses/:expenseId', authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const expenseId = req.params.expenseId;
  const { amount, description, participantIds, category } = req.body;
  
  console.log('✏️ Updating expense:', expenseId);
  
  try {
    // Get the expense and verify permissions
    const { data: expense, error: expenseError } = await supabaseAdmin
      .from('group_expenses')
      .select('*')
      .eq('id', expenseId)
      .single();
      
    if (expenseError || !expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    // Verify user is member of the group
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('*')
      .eq('group_id', expense.group_id)
      .eq('user_id', userId)
      .single();
      
    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update expense details
    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category;
    
    const { error: updateError } = await supabaseAdmin
      .from('group_expenses')
      .update(updateData)
      .eq('id', expenseId);
      
    if (updateError) {
      console.error('❌ Expense update error:', updateError);
      return res.status(400).json({ error: 'Failed to update expense' });
    }
    
    // If participant list changed, update participants
    if (participantIds && Array.isArray(participantIds)) {
      // Delete existing participants
      await supabaseAdmin
        .from('expense_participants')
        .delete()
        .eq('expense_id', expenseId);
      
      // Calculate new splits
      const finalAmount = amount !== undefined ? parseFloat(amount) : expense.amount;
      const splitAmounts = calculateEqualSplit(finalAmount, participantIds.length);
      
      // Create new participant records
      const participantRecords = participantIds.map((participantId, index) => ({
        expense_id: expenseId,
        participant_id: participantId,
        share_amount: splitAmounts[index]
      }));
      
      const { data: newParticipants, error: participantsError } = await supabaseAdmin
        .from('expense_participants')
        .insert(participantRecords)
        .select();
        
      if (participantsError) {
        console.error('❌ Participants update error:', participantsError);
        return res.status(400).json({ error: 'Failed to update participants' });
      }
      
      // Recalculate settlements for the entire group
      // This is complex, so for now we'll implement a simpler approach
      // TODO: Implement full recalculation logic
    }
    
    console.log('✅ Expense updated successfully');
    res.json({ message: 'Expense updated successfully' });
    
  } catch (err) {
    console.error('❌ Error updating expense:', err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/expenses/:expenseId', authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const expenseId = req.params.expenseId;
  
  console.log('🗑️ Deleting expense:', expenseId);
  
  try {
    // Get the expense and verify permissions
    const { data: expense, error: expenseError } = await supabaseAdmin
      .from('group_expenses')
      .select('*')
      .eq('id', expenseId)
      .single();
      
    if (expenseError || !expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    // Verify user is member of the group and created the expense
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('*')
      .eq('group_id', expense.group_id)
      .eq('user_id', userId)
      .single();
      
    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Only the creator can delete the expense
    if (expense.created_by !== userId) {
      return res.status(403).json({ error: 'Only the expense creator can delete it' });
    }
    
    // Delete participants first (due to foreign key constraint)
    await supabaseAdmin
      .from('expense_participants')
      .delete()
      .eq('expense_id', expenseId);
    
    // Delete the expense
    const { error: deleteError } = await supabaseAdmin
      .from('group_expenses')
      .delete()
      .eq('id', expenseId);
      
    if (deleteError) {
      console.error('❌ Expense deletion error:', deleteError);
      return res.status(400).json({ error: 'Failed to delete expense' });
    }
    
    // TODO: Recalculate settlements after deletion
    
    console.log('✅ Expense deleted successfully');
    res.json({ message: 'Expense deleted successfully' });
    
  } catch (err) {
    console.error('❌ Error deleting expense:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;
