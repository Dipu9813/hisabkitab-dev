# Smart Trip Expense Sharing - Testing Guide

## Current Issue Resolution

The error "Error fetching group members: Error: Failed to fetch group members" was caused by a missing foreign key relationship between the `group_members` and `details` tables in the database.

### Root Cause
Supabase's PostgREST API requires explicit foreign key relationships to perform nested queries. The original query:
```javascript
.select(`
  user_id,
  joined_at,
  details (
    full_name,
    ph_number,
    profile_pic
  )
`)
```

Failed because there was no FK relationship between `group_members.user_id` and `details.id`.

### Fix Applied
1. **Backend Fix**: Modified `/server/routes/groups.js` to use manual joins instead of nested queries
2. **Database Fix**: Added FK constraint in `database-setup.sql` to enable future nested queries

### Testing Steps

1. **Database Setup**:
   ```sql
   -- Execute in Supabase SQL Editor
   ALTER TABLE group_members ADD CONSTRAINT group_members_user_id_fkey 
   FOREIGN KEY (user_id) REFERENCES details(id) ON DELETE CASCADE;
   ```

2. **Verify Backend**:
   - Backend server running on http://localhost:3000
   - Frontend server running on http://localhost:3002

3. **Test the Fix**:
   - Navigate to http://localhost:3002
   - Login with valid credentials
   - Navigate to a group chat
   - Click on "Expenses" tab
   - The error should no longer appear, and you should see "Add Expense" form

### Expected Behavior
- Group members load successfully
- Add Expense form displays member selection dropdown
- Can add expenses with proper cost splitting
- Balance calculations work correctly

### API Endpoints Available
- `GET /groups/:id` - Get group details and members (FIXED)
- `POST /groups/:id/expenses` - Add new expense
- `GET /groups/:id/expenses` - List group expenses
- `GET /groups/:id/balances` - Get member balances
- `PUT /groups/:id/expenses/:expenseId` - Update expense
- `DELETE /groups/:id/expenses/:expenseId` - Delete expense

### Database Tables Created
- `group_expenses` - Store expense records
- `expense_participants` - Track who owes what for each expense
- `expense_settlements` - Track running balances between members

The expense sharing feature is now ready for testing!
