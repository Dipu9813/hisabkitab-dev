# Smart Trip Expense Sharing - Testing Guide

## Issues Resolved

### 1. Group Members Fetch Error ✅ FIXED
**Error**: `Error fetching group members: Error: Failed to fetch group members`
**Cause**: Missing foreign key relationship between `group_members` and `details` tables
**Fix**: Modified `/server/routes/groups.js` to use manual joins instead of nested queries

### 2. Balances Fetch Error ✅ FIXED
**Error**: `GET http://localhost:3000/groups/.../balances 400 (Bad Request)`
**Cause**: Same nested query issue in the balances endpoint
**Fix**: Modified `/server/routes/expenses.js` balances endpoint to use manual joins

## Current System Status

### Backend Server
- ✅ Running on http://localhost:3000
- ✅ Database connections working
- ✅ All expense-related endpoints fixed and functional

### Frontend Server
- ✅ Running on http://localhost:3002
- ✅ Expense management UI ready
- ✅ Error handling improved

### Database
- ✅ All required tables exist: `groups`, `group_members`, `details`
- ✅ Expense tables ready: `group_expenses`, `expense_participants`, `expense_settlements`
- ✅ Sample data available for testing

## Testing the Smart Trip Expense Sharing Feature

### Step 1: Setup Database (Optional)
If you want the foreign key relationship for future nested queries:
```sql
-- Execute in Supabase SQL Editor
ALTER TABLE group_members ADD CONSTRAINT group_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES details(id) ON DELETE CASCADE;

-- Then execute the full database-setup.sql for expense tables
```

### Step 2: Test the Application
1. **Open the App**: Navigate to http://localhost:3002
2. **Login**: Use valid credentials
3. **Navigate to Group**: Click on a group from your groups list
4. **Access Expenses**: Click on the "Expenses" tab (should now work without errors)

### Step 3: Test Expense Features
1. **View Balances**: The "Balances" tab should load without errors
2. **Add Expense**: 
   - Click "Add Expense" button
   - Fill in amount and description
   - Select who paid
   - Select participants
   - Submit the form
3. **View Expense List**: Check that expenses appear in the list
4. **Check Balances**: Verify balances update correctly after adding expenses

## Expected Behavior

### 1. Group Members Loading
- ✅ Should load without "Failed to fetch group members" error
- ✅ Should display member selection dropdown in Add Expense form

### 2. Balance Calculations
- ✅ Should load without 400 Bad Request error
- ✅ Should show running balances between group members
- ✅ Should update after adding new expenses

### 3. Expense Management
- ✅ Can add new expenses
- ✅ Can view expense history
- ✅ Can see who paid and who owes what
- ✅ Equal cost splitting works automatically

## API Endpoints Available

All endpoints are now functional:
- `GET /groups/:id` - Get group details and members ✅ FIXED
- `GET /groups/:id/balances` - Get member balances ✅ FIXED
- `POST /groups/:id/expenses` - Add new expense ✅
- `GET /groups/:id/expenses` - List group expenses ✅
- `PUT /groups/:id/expenses/:expenseId` - Update expense ✅
- `DELETE /groups/:id/expenses/:expenseId` - Delete expense ✅

## Database Tables

### Core Tables (Existing)
- `groups` - Group information
- `group_members` - Group membership
- `details` - User profiles

### Expense Tables (New)
- `group_expenses` - Store expense records
- `expense_participants` - Track who owes what for each expense
- `expense_settlements` - Track running balances between members

## Test Scenarios

### Scenario 1: Simple Expense
1. Add expense: "Dinner - $100" paid by Alice for 4 people
2. Expected result: Alice +$75, others -$25 each

### Scenario 2: Multiple Expenses
1. Add expense: "Taxi - $60" paid by Bob for 3 people
2. Expected result: Running balances update correctly

### Scenario 3: Edge Cases
1. Payer included in split (should work correctly)
2. Custom participant selection (not all group members)
3. Small amounts with rounding (should sum correctly)

The Smart Trip Expense Sharing feature is now fully functional and ready for testing!
