# Database Schema Documentation

## Overview

This document describes the database schema for the Literature Committee Management System. The system uses PostgreSQL as the primary database with Prisma as the ORM.

## Database Structure

### Core Entities

#### Users (`users`)
Stores user accounts with role-based access control.

- **id**: Unique identifier (CUID)
- **email**: User's email address (unique)
- **password**: Hashed password
- **firstName**: User's first name
- **lastName**: User's last name
- **role**: User role (GROUP, LOCAL_SUBCOMMITTEE, LOCALITY, REGION, ADMIN)
- **organizationId**: Reference to user's organization
- **isActive**: Account status flag
- **createdAt**: Account creation timestamp
- **updatedAt**: Last update timestamp

#### Organizations (`organizations`)
Represents the hierarchical structure of groups, local subcommittees, localities, and regions.

- **id**: Unique identifier (CUID)
- **name**: Organization name
- **type**: Organization type (GROUP, LOCAL_SUBCOMMITTEE, LOCALITY, REGION)
- **parentId**: Reference to parent organization (nullable for regions)
- **address**: Physical address
- **contactPerson**: Primary contact person
- **phone**: Contact phone number
- **email**: Contact email address
- **isActive**: Organization status flag
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp

#### Literature (`literature`)
Catalog of available literature items.

- **id**: Unique identifier (CUID)
- **title**: Literature title
- **description**: Detailed description
- **category**: Literature category
- **price**: Unit price (decimal)
- **isActive**: Availability flag
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp

#### Orders (`orders`)
Order management with status tracking and locking mechanism.

- **id**: Unique identifier (CUID)
- **orderNumber**: Human-readable order number (unique)
- **fromOrganizationId**: Ordering organization
- **toOrganizationId**: Fulfilling organization
- **status**: Order status (DRAFT, PENDING, APPROVED, IN_ASSEMBLY, SHIPPED, DELIVERED, COMPLETED, REJECTED)
- **totalAmount**: Total order value (decimal)
- **notes**: Optional order notes
- **lockedAt**: Lock timestamp (nullable)
- **lockedById**: User who locked the order (nullable)
- **createdAt**: Order creation timestamp
- **updatedAt**: Last update timestamp

#### Order Items (`order_items`)
Individual items within an order.

- **id**: Unique identifier (CUID)
- **orderId**: Reference to parent order
- **literatureId**: Reference to literature item
- **quantity**: Ordered quantity
- **unitPrice**: Price per unit at time of order (decimal)
- **totalPrice**: Total price for this line item (decimal)

#### Inventory (`inventory`)
Stock levels for each organization and literature combination.

- **id**: Unique identifier (CUID)
- **organizationId**: Organization owning the stock
- **literatureId**: Literature item
- **quantity**: Available quantity
- **reservedQuantity**: Reserved quantity (for pending orders)
- **lastUpdated**: Last inventory update timestamp

#### Transactions (`transactions`)
Audit trail of all literature movements.

- **id**: Unique identifier (CUID)
- **type**: Transaction type (INCOMING, OUTGOING, ADJUSTMENT)
- **fromOrganizationId**: Source organization (nullable for incoming)
- **toOrganizationId**: Destination organization
- **literatureId**: Literature item involved
- **quantity**: Quantity moved
- **unitPrice**: Price per unit (decimal)
- **totalAmount**: Total transaction value (decimal)
- **orderId**: Related order (nullable)
- **notes**: Optional transaction notes
- **createdAt**: Transaction timestamp

## Relationships

### Organization Hierarchy
```
Region (1)
├── Locality (N)
│   ├── Group (N)
│   └── Local Subcommittee (N)
└── Direct Groups (N) [exceptional cases]
```

### Order Flow
```
Group/Local Subcommittee → Locality → Region
```

### Data Flow
```
Order → Order Items → Inventory Updates → Transactions
```

## Indexes

Performance indexes are created on frequently queried fields:

- **Users**: email, organizationId
- **Organizations**: type, parentId
- **Literature**: category, isActive
- **Orders**: status, fromOrganizationId, toOrganizationId, createdAt
- **Order Items**: orderId, literatureId
- **Inventory**: organizationId, literatureId
- **Transactions**: type, organizationId fields, literatureId, createdAt

## Business Rules

### Order Status Flow
```
DRAFT → PENDING → APPROVED → IN_ASSEMBLY → SHIPPED → DELIVERED → COMPLETED
   ↓        ↓         ↓
REJECTED ← REJECTED ← REJECTED
```

### Editing Rules
- Orders can be edited in DRAFT, PENDING, and APPROVED statuses
- Orders are automatically locked when status changes to IN_ASSEMBLY
- Only the receiving organization can lock/unlock orders
- Locked orders cannot be edited by the ordering organization

### Hierarchy Rules
- Groups and Local Subcommittees can only order from their parent Locality
- Localities can only order from their parent Region
- Regions can send directly to any organization (exceptional cases)

### Inventory Rules
- Stock is reserved when orders are approved
- Stock is deducted when orders are shipped
- Reservations are released when orders are rejected or cancelled

## Migration Commands

```bash
# Generate Prisma client
npm run db:generate

# Create and apply migration
npm run db:migrate

# Seed database with test data
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

## Environment Variables

Required environment variables for database connection:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

## Development Setup

1. Start PostgreSQL database (via Docker Compose):
   ```bash
   docker-compose up -d postgres
   ```

2. Apply migrations:
   ```bash
   npm run db:migrate
   ```

3. Seed with test data:
   ```bash
   npm run db:seed
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Test Data

The seed script creates:
- 1 Region (Сибирь)
- 2 Localities (Новосибирск, Томск)
- 1 Local Subcommittee (Центральный)
- 3 Groups (Новая жизнь, Надежда, Свобода)
- 8 Users (one for each organization)
- 5 Literature items
- Sample inventory records
- 3 Sample orders with different statuses
- Sample transaction records

All test users have the password: `password123`

## Security Considerations

- Passwords are hashed using bcrypt
- User roles control access to different API endpoints
- Organization hierarchy is enforced at the database level
- Audit trail is maintained through the transactions table
- Soft deletes are used where appropriate (isActive flags)