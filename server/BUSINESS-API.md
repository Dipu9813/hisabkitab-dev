# Business Account API Documentation

## Overview

The Business Account feature allows users to create shared business accounts where multiple users can collaborate to manage customer loans and credits. Each business has a unique 6-character ID for easy sharing.

## Database Schema

### Tables Created

1. **businesses** - Stores business information
2. **business_members** - Manages business membership
3. **business_loans** - Tracks customer loans/credits

## API Endpoints

### 1. Create Business

**Endpoint:** `POST /business/create`
**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "name": "My Shop Business"
}
```

**Response:**

```json
{
  "message": "Business created successfully",
  "business": {
    "id": "uuid-here",
    "name": "My Shop Business",
    "businessId": "A1B2C3",
    "createdBy": "user-id",
    "createdAt": "2025-06-21T..."
  }
}
```

**Features:**

- Generates unique 6-character business ID
- Auto-joins creator as member
- Validates business name

### 2. Join Business

**Endpoint:** `POST /business/join`
**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "businessId": "A1B2C3"
}
```

**Response:**

```json
{
  "message": "Successfully joined business",
  "business": {
    "id": "uuid-here",
    "name": "My Shop Business",
    "businessId": "A1B2C3",
    "joinedAt": "2025-06-21T..."
  }
}
```

**Features:**

- Case-insensitive business ID matching
- Prevents duplicate memberships
- Validates business ID format

### 3. Get My Businesses

**Endpoint:** `GET /business/my-businesses`
**Authentication:** Required (Bearer token)

**Response:**

```json
{
  "data": [
    {
      "id": "uuid-here",
      "name": "My Shop Business",
      "businessId": "A1B2C3",
      "createdBy": "user-id",
      "createdAt": "2025-06-21T...",
      "joinedAt": "2025-06-21T...",
      "isOwner": true
    }
  ]
}
```

### 4. Add Customer Loan

**Endpoint:** `POST /business/loan`
**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "businessId": "uuid-here",
  "customerName": "John Customer",
  "amount": 150.5,
  "description": "Groceries on credit"
}
```

**Response:**

```json
{
  "message": "Loan added successfully",
  "loan": {
    "id": "loan-uuid",
    "businessId": "uuid-here",
    "customerName": "John Customer",
    "amount": 150.5,
    "description": "Groceries on credit",
    "isPaid": false,
    "date": "2025-06-21T...",
    "addedBy": "User Full Name",
    "addedById": "user-id"
  }
}
```

**Features:**

- Validates user is business member
- Requires positive amount
- Tracks who added the loan

### 5. Get Business Loans

**Endpoint:** `GET /business/:businessId/loans`
**Authentication:** Required (Bearer token)

**Query Parameters:**

- `limit` (optional): Number of loans to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `isPaid` (optional): Filter by payment status (true/false)

**Response:**

```json
{
  "data": [
    {
      "id": "loan-uuid",
      "businessId": "uuid-here",
      "customerName": "John Customer",
      "amount": 150.5,
      "description": "Groceries on credit",
      "isPaid": false,
      "date": "2025-06-21T...",
      "addedBy": "User Full Name",
      "addedById": "user-id",
      "addedByProfilePic": "url-or-null"
    }
  ]
}
```

### 6. Update Loan Status

**Endpoint:** `PATCH /business/loan/:loanId/status`
**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "isPaid": true
}
```

**Response:**

```json
{
  "message": "Loan marked as paid",
  "loan": {
    "id": "loan-uuid",
    "customerName": "John Customer",
    "amount": 150.5,
    "isPaid": true,
    "updatedAt": "2025-06-21T..."
  }
}
```

### 7. Get Business Details

**Endpoint:** `GET /business/:businessId/details`
**Authentication:** Required (Bearer token)

**Response:**

```json
{
  "business": {
    "id": "uuid-here",
    "name": "My Shop Business",
    "businessId": "A1B2C3",
    "createdBy": "user-id",
    "createdAt": "2025-06-21T...",
    "isOwner": true
  },
  "members": [
    {
      "userId": "user-id",
      "fullName": "John Doe",
      "phoneNumber": "1234567890",
      "profilePic": "url-or-null",
      "joinedAt": "2025-06-21T...",
      "isOwner": true
    }
  ]
}
```

## Business ID Format

- **Length:** Exactly 6 characters
- **Characters:** Alphanumeric (A-Z, 0-9)
- **Case:** Stored as uppercase, accepts lowercase input
- **Example:** `A1B2C3`, `XYZ789`, `MIX3D1`

## Error Responses

### Common Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (not a business member)
- `404` - Not Found (business/loan not found)
- `500` - Internal Server Error

### Example Error Response

```json
{
  "error": "Business ID is required"
}
```

## Security Features

### Row Level Security (RLS)

- Users can only access businesses they are members of
- Loan access is restricted to business members
- Business creation requires valid authentication

### Permissions

- **Any Member:** View business, add loans, update loan status
- **Owner:** All member permissions (future: manage members)
- **Non-Members:** No access to business data

## Usage Examples

### Creating and Joining a Business

```bash
# Create business
curl -X POST http://localhost:3000/business/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Corner Shop"}'

# Join business (using returned businessId)
curl -X POST http://localhost:3000/business/join \
  -H "Authorization: Bearer OTHER_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"businessId": "A1B2C3"}'
```

### Managing Customer Loans

```bash
# Add customer loan
curl -X POST http://localhost:3000/business/loan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "uuid-here",
    "customerName": "Sarah Johnson",
    "amount": 75.25,
    "description": "Phone repair on credit"
  }'

# Mark loan as paid
curl -X PATCH http://localhost:3000/business/loan/LOAN_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isPaid": true}'
```

## Setup Instructions

1. **Apply Database Schema:**

   ```bash
   node apply-business-schema.js
   ```

   Or manually run `business-schema.sql` in Supabase SQL editor

2. **Test Business Functionality:**

   ```bash
   node test-business.js
   ```

3. **Start Server:**
   ```bash
   npm start
   ```

The business routes are automatically included when the server starts.
