# Sadza Statistics Domain Implementation

## Overview
The sadza-stats domain has been successfully implemented to track community sadza distribution statistics for Dzikwa Trust.

## Features Implemented

### 1. Database Schema
- **sadza_recipients table**: Stores recipient information
  - full_name, phone, email
  - is_dzikwa_child (boolean)
  - school_name
  - is_active status
  
- **sadza_distributions table**: Tracks distribution records
  - recipient_id (foreign key)
  - distribution_date
  - sadza_portions (number)
  - distribution_purpose
  - notes

### 2. Frontend Components
- **SadzaStatsPage**: Complete management interface
  - Statistics dashboard with cards
  - Recipient management (CRUD operations)
  - Distribution recording
  - Recent distributions table
  - CSV export functionality

### 3. Integration Points
- **Search Integration**: Added to universal search across all domains
- **Navigation**: Added "Sadza Stats" menu item with Utensils icon
- **Check-in Form**: Updated to include sadza recipients in search
- **Routing**: Added `/sadza-stats` route

## Key Features

### Statistics Dashboard
- Total recipients count
- Dzikwa children count
- Community members count
- Total portions distributed

### Recipient Management
- Add new recipients
- Edit existing recipients
- Delete recipients
- Mark as Dzikwa child or community member
- School information for children

### Distribution Tracking
- Record daily distributions
- Track number of portions
- Purpose and notes for each distribution
- Date-based filtering

### Data Export
- CSV export of distribution records
- Includes recipient details and distribution info

## Database Setup

To set up the new domain, run the SQL schema:

```sql
-- Run the database-schema-sadza-stats.sql file
-- This will create tables, indexes, RLS policies, and triggers
```

## Usage

1. **Access**: Navigate to `/sadza-stats` or use the navigation menu
2. **Add Recipients**: Click "Add Recipient" to register new people
3. **Record Distributions**: Click "Record Distribution" to log sadza portions
4. **View Statistics**: Dashboard shows real-time statistics
5. **Export Data**: Use "Export CSV" for external reporting

## Technical Implementation

### Files Modified/Created:
- `database-schema-sadza-stats.sql` - New database schema
- `src/pages/SadzaStatsPage.tsx` - Main management page
- `src/lib/supabase.ts` - Added sadza functions and interfaces
- `src/components/CheckInForm.tsx` - Updated Person interface
- `src/components/Navigation.tsx` - Added navigation item
- `src/pages/Index.tsx` - Added sadza domain handler
- `src/App.tsx` - Added route configuration

### New Functions Added:
- `createSadzaRecipient()` - Add new recipients
- `getSadzaRecipients()` - Fetch all recipients
- `updateSadzaRecipient()` - Update recipient info
- `deleteSadzaRecipient()` - Remove recipients
- `createSadzaDistribution()` - Record distributions
- `getSadzaDistributions()` - Fetch distribution history
- `getSadzaStats()` - Get summary statistics

### New Interfaces:
- `SadzaRecipient` - Recipient data structure
- `SadzaDistribution` - Distribution record structure
- `SadzaStats` - Statistics summary structure

## Security
- Row Level Security (RLS) policies implemented
- Only authenticated users can modify data
- Public read access for active recipients

## Future Enhancements
- Monthly/quarterly reporting
- Distribution trends visualization
- SMS notifications for recipients
- Bulk recipient import
- Advanced filtering and search
