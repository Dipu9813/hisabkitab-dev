const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../utils/supabaseClient');
const authenticateToken = require('../middleware/authenticateToken');

// Archive a group (safe deletion with backup)
router.post('/groups/:groupId/archive', authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const groupId = req.params.groupId;
  const { reason = 'Archived via API' } = req.body;

  console.log('🗃️ Archive request for group:', groupId, 'by user:', userId);

  try {
    // Verify user is the creator of the group
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.creator_id !== userId) {
      return res.status(403).json({ 
        error: 'Only the group creator can archive the group' 
      });
    }

    // Get group statistics before archiving
    const { data: expenses } = await supabaseAdmin
      .from('group_expenses')
      .select('amount')
      .eq('group_id', groupId);

    const { data: members } = await supabaseAdmin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    const totalAmount = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const expenseCount = expenses?.length || 0;
    const memberCount = members?.length || 0;

    // Execute the archive and delete operation
    const { error: archiveError } = await supabaseAdmin.rpc('archive_and_delete_group', {
      target_group_id: groupId,
      archive_reason: reason
    });

    if (archiveError) {
      console.error('Archive operation failed:', archiveError);
      return res.status(500).json({ 
        error: 'Failed to archive group: ' + archiveError.message 
      });
    }

    console.log('✅ Group archived successfully:', groupId);

    res.json({
      message: 'Group archived successfully',
      summary: {
        groupId: groupId,
        groupName: group.name,
        expenseCount: expenseCount,
        memberCount: memberCount,
        totalAmount: totalAmount,
        archivedAt: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('Error archiving group:', err);
    res.status(500).json({ error: 'Failed to archive group' });
  }
});

// List archived groups
router.get('/archived-groups', authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const { limit = 20, offset = 0 } = req.query;

  try {
    // Get archived groups created by the user
    const { data: archivedGroups, error } = await supabaseAdmin
      .from('groups_archive')
      .select(`
        id,
        name,
        archived_at,
        archive_reason,
        creator_id
      `)
      .eq('creator_id', userId)
      .order('archived_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error('Error fetching archived groups:', error);
      return res.status(400).json({ error: error.message });
    }

    // Get additional statistics for each archived group
    const enrichedGroups = await Promise.all(
      archivedGroups.map(async (group) => {
        const { data: expenseStats } = await supabaseAdmin
          .from('group_expenses_archive')
          .select('amount')
          .eq('group_id', group.id);

        const { data: memberCount } = await supabaseAdmin
          .from('group_members_archive')
          .select('user_id', { count: 'exact' })
          .eq('group_id', group.id);

        return {
          ...group,
          statistics: {
            expenseCount: expenseStats?.length || 0,
            totalAmount: expenseStats?.reduce((sum, exp) => sum + exp.amount, 0) || 0,
            memberCount: memberCount?.length || 0
          }
        };
      })
    );

    res.json({ data: enrichedGroups });

  } catch (err) {
    console.error('Error fetching archived groups:', err);
    res.status(500).json({ error: 'Failed to fetch archived groups' });
  }
});

// Get archived group details
router.get('/archived-groups/:groupId', authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const groupId = req.params.groupId;

  try {
    // Get archived group
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups_archive')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({ error: 'Archived group not found' });
    }

    // Verify user has access (creator or was a member)
    const { data: membership } = await supabaseAdmin
      .from('group_members_archive')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (group.creator_id !== userId && !membership) {
      return res.status(403).json({ error: 'Access denied to this archived group' });
    }

    // Get archived members with details
    const { data: archivedMembers } = await supabaseAdmin
      .from('group_members_archive')
      .select(`
        user_id,
        joined_at
      `)
      .eq('group_id', groupId);

    // Get user details for members
    const memberIds = archivedMembers?.map(m => m.user_id) || [];
    let memberDetails = [];

    if (memberIds.length > 0) {
      const { data: userDetails } = await supabaseAdmin
        .from('details')
        .select('id, full_name, profile_pic')
        .in('id', memberIds);

      memberDetails = archivedMembers.map(member => ({
        ...member,
        details: userDetails?.find(d => d.id === member.user_id)
      }));
    }

    // Get archived expenses
    const { data: archivedExpenses } = await supabaseAdmin
      .from('group_expenses_archive')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    res.json({
      group: group,
      members: memberDetails,
      expenses: archivedExpenses || [],
      summary: {
        expenseCount: archivedExpenses?.length || 0,
        totalAmount: archivedExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0,
        memberCount: memberDetails.length
      }
    });

  } catch (err) {
    console.error('Error fetching archived group details:', err);
    res.status(500).json({ error: 'Failed to fetch archived group details' });
  }
});

// Restore archived group
router.post('/archived-groups/:groupId/restore', authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const groupId = req.params.groupId;

  try {
    // Verify archived group exists and user is creator
    const { data: archivedGroup, error: groupError } = await supabaseAdmin
      .from('groups_archive')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError || !archivedGroup) {
      return res.status(404).json({ error: 'Archived group not found' });
    }

    if (archivedGroup.creator_id !== userId) {
      return res.status(403).json({ 
        error: 'Only the group creator can restore the group' 
      });
    }

    // Check if group already exists in main tables
    const { data: existingGroup } = await supabaseAdmin
      .from('groups')
      .select('id')
      .eq('id', groupId)
      .single();

    if (existingGroup) {
      return res.status(400).json({ 
        error: 'Group already exists in active groups. Cannot restore.' 
      });
    }

    // Execute the restore operation
    const { error: restoreError } = await supabaseAdmin.rpc('restore_archived_group', {
      target_group_id: groupId
    });

    if (restoreError) {
      console.error('Restore operation failed:', restoreError);
      return res.status(500).json({ 
        error: 'Failed to restore group: ' + restoreError.message 
      });
    }

    console.log('✅ Group restored successfully:', groupId);

    res.json({
      message: 'Group restored successfully',
      groupId: groupId,
      groupName: archivedGroup.name,
      restoredAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('Error restoring group:', err);
    res.status(500).json({ error: 'Failed to restore group' });
  }
});

// Permanently delete archived group
router.delete('/archived-groups/:groupId', authenticateToken, async (req, res) => {
  const userId = req.user.sub;
  const groupId = req.params.groupId;

  try {
    // Verify archived group exists and user is creator
    const { data: archivedGroup, error: groupError } = await supabaseAdmin
      .from('groups_archive')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError || !archivedGroup) {
      return res.status(404).json({ error: 'Archived group not found' });
    }

    if (archivedGroup.creator_id !== userId) {
      return res.status(403).json({ 
        error: 'Only the group creator can permanently delete the group' 
      });
    }

    // Execute permanent deletion from archive tables
    const { error: deleteError } = await supabaseAdmin.rpc('permanently_delete_archived_group', {
      target_group_id: groupId
    });

    if (deleteError) {
      console.error('Permanent deletion failed:', deleteError);
      return res.status(500).json({ 
        error: 'Failed to permanently delete group: ' + deleteError.message 
      });
    }

    console.log('✅ Archived group permanently deleted:', groupId);

    res.json({
      message: 'Archived group permanently deleted',
      groupId: groupId,
      groupName: archivedGroup.name,
      deletedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('Error permanently deleting archived group:', err);
    res.status(500).json({ error: 'Failed to permanently delete archived group' });
  }
});

module.exports = router;
