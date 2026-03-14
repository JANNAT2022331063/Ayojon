# Ayojon Event Management System
### User Flow
1. User browses available events
2. Selects event and views all available payment methods
3. Makes payment via their preferred mobile banking app
4. Enters transaction ID and phone number used for payment
5. Receives welcome email and SMS with booking details
6. Gets automatic updates if event time/date changes

### Organizer Flow
1. Organizer signs up with multiple payment methods
2. Admin approves organizer account
3. Organizer creates events
4. Users book events and make payments
5. Organizer can view bookings with transaction details
6. Can update event time/date (triggers automatic notifications)

## 📋 Prerequisites

- **XAMPP** (or similar) for MySQL database
- **Node.js** and npm installed
- Gmail account for email notifications (optional for testing)

## 🚀 Setup Instructions

### 1. Database Setup

Start your MySQL server (XAMPP or similar), then run one of these options:

**Option A: Complete Fresh Install**
```bash
mysql -u root < database_schema.sql
```

### 2. Install Dependencies

```bash
npm install
```

## 📁 Project Structure

```
ayojon/
├── index.html                    # Landing page with signup/login
├── user_dashboard.html           # User dashboard with event booking
├── organizer_dashboard.html      # Organizer event management
├── admin_dashboard.html          # Admin approval panel
├── server.js                     # Backend API with all endpoints
├── style.css                     # Shared styles
├── package.json                  # Node dependencies
├── database_schema.sql           # Complete database setup
└── update_payment_schema.sql     # Migration for existing database
```






