# Smart Trip Expense Sharing - Setup Instructions

## Overview
This implementation adds a comprehensive expense sharing feature to your group chat application. Users can now add expenses, select participants, and track balances automatically.

## Database Setup

### 1. Execute Database Schema
Run the SQL commands in `database-setup.sql` in your Supabase SQL Editor:

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `database-setup.sql`
4. Execute the SQL script

This will create:
- `group_expenses` table - stores expense records
- `expense_participants` table - tracks who participated in each expense
- `expense_settlements` table - maintains running balances between members
- Proper indexes for performance
- Row Level Security (RLS) policies
- Helper functions for balance calculations

## Backend Setup

### 1. New API Endpoints
The following endpoints are now available:

#### Expense Management
- `POST /groups/:groupId/expenses` - Add new expense
- `GET /groups/:groupId/expenses` - Get group expenses
- `GET /groups/:groupId/balances` - Get member balances
- `PUT /expenses/:expenseId` - Update expense
- `DELETE /expenses/:expenseId` - Delete expense

### 2. Route Integration
The expense routes are automatically integrated into your existing server via `server/routes/expenses.js`.

## Frontend Components

### New Components Added:
1. **AddExpenseForm.tsx** - Form to add new expenses with participant selection
2. **ExpenseList.tsx** - Display list of expenses with details
3. **BalancesSummary.tsx** - Show member balances and who owes whom
4. **ExpenseManager.tsx** - Main container component with tabs

### Enhanced Components:
- **GroupChatInterface.tsx** - Now includes tabs for Chat and Expenses

## Features Implemented

### ✅ Core Features
- **Add Expenses**: Users can add expenses with description, amount, and category
- **Smart Participant Selection**: Choose who to split expenses with (all members or custom selection)
- **Automatic Split Calculation**: Handles equal splits with proper rounding
- **Payer Selection**: Choose who paid for the expense
- **Balance Tracking**: Real-time balance calculations showing who owes whom
- **Expense Categories**: Organized expenses by category (food, transport, accommodation, etc.)

### ✅ Advanced Features
- **Proper Rounding**: Handles cents distribution fairly (e.g., ₹100/3 = ₹33.34, ₹33.33, ₹33.33)
- **Payer Participation**: Correctly handles when payer is also a participant
- **Real-time Updates**: Balances update immediately when expenses are added
- **Expense History**: View all group expenses with participant details
- **Permission System**: Only expense creators can delete their expenses
- **Responsive Design**: Works well on mobile and desktop

### ✅ Edge Cases Handled
- Payer is also among participants (reduces their net payment)
- Minimum one participant required
- Proper error handling for invalid amounts
- Group membership verification
- Concurrent expense handling

## User Experience Flow

### Adding an Expense:
1. User clicks "Add Expense" button in the expenses tab
2. Fill in amount, description, and select category
3. Choose who paid for the expense
4. Select participants (all selected by default)
5. Preview shows calculated split amounts
6. Submit to create expense

### Viewing Balances:
1. Switch to "Balances" tab within expenses
2. View "Your Balance" for personal summary
3. Switch to "Everyone" to see all member balances
4. See who owes whom and amounts

## Technical Implementation

### Split Calculation Algorithm:
```javascript
function calculateEqualSplit(amount, participantCount) {
  const totalCents = Math.round(amount * 100);
  const baseCents = Math.floor(totalCents / participantCount);
  const remainder = totalCents % participantCount;
  
  // Distribute remainder cents to first participants
  const splits = [];
  for (let i = 0; i < participantCount; i++) {
    const extraCent = i < remainder ? 1 : 0;
    splits.push((baseCents + extraCent) / 100);
  }
  
  return splits;
}
```

### Balance Tracking:
- Uses `expense_settlements` table to maintain running balances
- Updates balances whenever expenses are added/modified
- Calculates net positions (who owes money vs who is owed money)

## Security Features

### Row Level Security (RLS):
- Only group members can view/add expenses
- Only expense creators can delete their expenses
- Automatic user verification through JWT tokens

### Data Validation:
- Amount must be positive
- Description is required
- Participants must be group members
- Payer must be a group member

## Usage Instructions

### For Users:
1. **Navigate to Group Chat**: Open any group chat
2. **Switch to Expenses**: Click the "💰 Expenses" tab
3. **Add Expense**: Click "Add Expense" button
4. **Fill Details**: Enter amount, description, select payer and participants
5. **View Balances**: Switch to "Balances" tab to see who owes what

### For Developers:
1. **Database Setup**: Execute `database-setup.sql` in Supabase
2. **Server Restart**: Restart your backend server to load new routes
3. **Frontend Build**: Build the frontend to include new components
4. **Testing**: Test the expense flow end-to-end

## Testing Scenarios

### Recommended Test Cases:
1. **Basic Split**: Add ₹100 expense split among 3 people
2. **Payer Participation**: Add expense where payer is also a participant
3. **Custom Participants**: Add expense split among only some members
4. **Balance Verification**: Verify balances update correctly
5. **Edge Amounts**: Test with amounts like ₹0.01, ₹999.99
6. **Multiple Expenses**: Add several expenses and verify running balances

## Future Enhancements

### Potential Additions:
- **Unequal Splits**: Allow percentage-based or custom amount splits
- **Expense Photos**: Add photo attachments to expenses
- **Settlement Tracking**: Track when members settle their debts
- **Expense Categories**: Custom categories per group
- **Export/Import**: Export expense data to CSV/Excel
- **Notifications**: Notify members when new expenses are added

This implementation provides a solid foundation for group expense sharing with room for future enhancements based on user feedback.
