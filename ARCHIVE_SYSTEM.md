# Archive Before Delete System

A comprehensive archiving system for safely deleting groups while preserving data for recovery.

## 🎯 **Overview**

Instead of permanently deleting groups and losing all data, this system:
1. **Archives all group data** to backup tables
2. **Safely deletes** from main tables
3. **Enables recovery** if needed
4. **Provides management tools** for archived data

## 📁 **Files Created**

- `archive-group.sql` - Manual archive and delete script
- `restore-group.sql` - Manual restore script  
- `archive-utilities.sql` - Management and query utilities
- `archive-functions.sql` - SQL functions for API operations
- `routes/archive.js` - API endpoints for programmatic access

## 🚀 **Setup Instructions**

### **1. Create Archive Tables**
Run this in Supabase SQL Editor:
```sql
-- Execute the archive table creation section from archive-group.sql
-- This creates all the *_archive tables
```

### **2. Install SQL Functions**
```sql
-- Execute archive-functions.sql to create the utility functions
```

### **3. Add API Routes**
The archive routes are automatically included when you start the server.

## 📖 **Usage Methods**

### **Method 1: Manual SQL Script**
For direct database access:

```sql
-- 1. Edit archive-group.sql
-- Replace 'YOUR_GROUP_ID_HERE' with actual group ID
DO $$
DECLARE 
    target_group_id UUID := 'fa2cc945-b390-453b-90c0-6c7616b58911'; -- CHANGE THIS
BEGIN
    -- Archive and delete process runs here
END $$;
```

### **Method 2: API Endpoints**
For programmatic access:

```javascript
// Archive a group
POST /groups/{groupId}/archive
Headers: { Authorization: "Bearer {token}" }
Body: { reason: "Optional archive reason" }

// List archived groups
GET /archived-groups
Headers: { Authorization: "Bearer {token}" }

// Get archived group details
GET /archived-groups/{groupId}
Headers: { Authorization: "Bearer {token}" }

// Restore archived group
POST /archived-groups/{groupId}/restore
Headers: { Authorization: "Bearer {token}" }

// Permanently delete archived group
DELETE /archived-groups/{groupId}
Headers: { Authorization: "Bearer {token}" }
```

## 🗂️ **Archive Tables Structure**

| Original Table | Archive Table | Purpose |
|---|---|---|
| `groups` | `groups_archive` | Group metadata |
| `group_members` | `group_members_archive` | Member relationships |
| `group_expenses` | `group_expenses_archive` | Expense records |
| `expense_participants` | `expense_participants_archive` | Who participated in expenses |
| `expense_settlements` | `expense_settlements_archive` | Balance calculations |
| `group_messages` | `group_messages_archive` | Chat history |
| `optimized_settlements` | `optimized_settlements_archive` | Settlement phase data |
| `individual_balances` | `individual_balances_archive` | Final balance snapshots |

## 🔧 **Management Operations**

### **List All Archived Groups**
```sql
SELECT 
    ga.name,
    ga.archived_at,
    ga.archive_reason,
    d.full_name as creator_name
FROM groups_archive ga
LEFT JOIN details d ON ga.creator_id = d.id
ORDER BY ga.archived_at DESC;
```

### **Get Archive Statistics**
```sql
SELECT * FROM get_archive_statistics();
```

### **Cleanup Old Archives**
```sql
-- Delete archives older than 12 months
SELECT cleanup_old_archives(12);
```

### **Search Archived Groups**
```sql
SELECT * FROM groups_archive 
WHERE name ILIKE '%vacation%'
ORDER BY archived_at DESC;
```

## 🔄 **Recovery Process**

### **Quick Restore (API)**
```bash
curl -X POST "http://localhost:3000/archived-groups/{groupId}/restore" \
  -H "Authorization: Bearer {token}"
```

### **Manual Restore (SQL)**
```sql
-- Edit restore-group.sql
DO $$
DECLARE 
    target_group_id UUID := 'YOUR_GROUP_ID'; -- CHANGE THIS
BEGIN
    -- Restoration process runs here
END $$;
```

## ⚠️ **Important Notes**

### **Permissions**
- Only **group creators** can archive/restore groups
- Only **group members** can view archived group details

### **Data Integrity**
- Archive operations are **transactional** (all-or-nothing)
- Original relationships are preserved in archive tables
- Archive timestamps track when data was moved

### **Storage Considerations**
- Archive tables grow over time
- Use cleanup functions to manage storage
- Consider exporting old archives to external storage

## 🛡️ **Safety Features**

### **Validation Checks**
- Verifies group exists before archiving
- Prevents duplicate restorations
- Checks user permissions

### **Transaction Safety**
- All operations wrapped in transactions
- Automatic rollback on errors
- Detailed logging and error reporting

### **Data Preservation**
- Complete data snapshot before deletion
- Maintains referential integrity
- Preserves original timestamps

## 📊 **Example Workflows**

### **Archive a Group**
```javascript
// 1. API call to archive
const response = await fetch('/groups/abc123/archive', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ 
    reason: 'Trip completed, archiving for records' 
  })
});

// 2. Group is archived and deleted from main tables
// 3. All related data safely stored in archive tables
```

### **Restore if Needed**
```javascript
// 1. List archived groups
const archived = await fetch('/archived-groups', {
  headers: { 'Authorization': 'Bearer ' + token }
});

// 2. Restore specific group
const restore = await fetch('/archived-groups/abc123/restore', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token }
});

// 3. Group and all data restored to main tables
```

This system provides **enterprise-grade data safety** while enabling clean group management! 🏆
