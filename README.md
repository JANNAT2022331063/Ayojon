# Ayojon Event Management System

## 🎉 Features Implemented

### Payment System
- **Multiple Mobile Banking Support**: bKash, Nagad, Upay, Rocket
- **Transaction Verification**: Users must provide transaction ID and payment phone number
- **Organizer Payment Setup**: Organizers can configure multiple payment methods
- **Payment Status Tracking**: Bookings have pending/completed status

### Notification System
- **Email Notifications**: 
  - Welcome message on booking
  - Booking confirmation with full details including transaction ID
  - Event update notifications when date/time changes
  
- **SMS Notifications**: 
  - Booking confirmation via SMS
  - Event update alerts via SMS
  - Transaction ID included in notifications

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

**Option B: Update Existing Database**
```bash
mysql -u root < update_payment_schema.sql
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Email and SMS Notifications

The application uses environment variables for sensitive credentials. Follow these steps:

#### Step 1: Edit the `.env` file

Open `/Users/shahed/Desktop/ayojon/.env` and configure your credentials:

**Email Setup (Gmail):**
1. Go to Gmail Security Settings: https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Generate an App Password: https://myaccount.google.com/apppasswords
4. Update `.env`:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   ```

**SMS Setup (Choose ONE provider):**

**Option A: Twilio (Recommended for Testing - Free Trial)**
1. Sign up at https://www.twilio.com/try-twilio
2. Get free trial credits
3. Copy credentials from dashboard
4. Uncomment and fill in `.env`:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

**Option B: SSL Wireless (Bangladesh Local Provider)**
1. Contact SSL Wireless: https://sslwireless.com
2. Get API credentials
3. Uncomment and fill in `.env`:
   ```env
   SSL_API_TOKEN=your_api_token
   SSL_SID=your_sender_id
   SSL_API_URL=https://sslwireless.com/api/v3/send-sms
   ```

**Option C: Other SMS Providers**
1. Get credentials from your SMS provider
2. Uncomment and configure in `.env`:
   ```env
   SMS_API_URL=https://api.example.com/send
   SMS_API_KEY=your_api_key
   SMS_API_SECRET=your_api_secret
   SMS_SENDER_ID=YourBrand
   ```

> **Note**: If you don't configure SMS, the system will run in mock mode (logs to console only). Email notifications work independently from SMS.


### 4. Start the Server

```bash
npm start
```

Server will run on: http://localhost:3000

### 5. Open the Application

Open your browser and navigate to:
```
http://localhost:3000/index.html
```

## 🎯 Testing the Payment Flow

### Create Test Accounts

1. **Admin Account**:
   - Sign up as Admin
   - Use this to approve organizers

2. **Organizer Account**:
   - Sign up as Organizer
   - Fill in payment methods:
     - bKash: 01712345678
     - Nagad: 01812345678
     - Upay: 01912345678
     - Rocket: 01612345678
   - Wait for admin approval

3. **User Account**:
   - Sign up as User
   - Browse and book events

### Test Booking Flow

1. Login as approved Organizer
2. Create a new event with ticket price
3. Login as User
4. View events and click "Book Now"
5. See all payment methods available
6. Select payment method (e.g., bKash)
7. Enter transaction details:
   - Transaction ID: TEST123456789
   - Payment Phone: 01712345678
8. Submit booking
9. Check email for booking confirmation

### Test Event Updates

1. Login as Organizer
2. Go to "My Events"
3. Update event date or time
4. All users who booked will receive email and SMS notifications

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

## 🔧 API Endpoints

### Authentication
- `POST /auth/signup/user` - User registration
- `POST /auth/signup/organizer` - Organizer registration (with payment methods)
- `POST /auth/signup/admin` - Admin registration
- `POST /auth/login/:role` - Login for all roles

### Events
- `GET /events` - Get all upcoming events with payment details
- `POST /events` - Create new event (organizer)
- `PUT /events/:id` - Update event (triggers notifications)
- `DELETE /events/:id` - Delete event

### Bookings
- `POST /book` - Create booking with transaction details
- `GET /user-bookings/:userId` - Get user's bookings
- `GET /event-users/:eventId` - Get event attendees

### Admin
- `GET /admin/organizers` - Get all organizers with payment info
- `POST /admin/approve-organizer` - Approve organizer account

## 💳 Payment Method Integration

Currently, the system guides users to make manual payments through mobile banking apps. Each booking requires:
- **Payment Method**: bKash/Nagad/Upay/Rocket
- **Transaction ID**: User must provide the transaction ID from their payment
- **Payment Phone**: The phone number used to make the payment

For production, you can integrate with:
- bKash Payment Gateway API
- Nagad Payment API
- Other mobile financial service APIs

## 📧 Notification Features

### Email Templates
- **Booking Confirmation**: Includes event details, payment info, transaction ID
- **Event Updates**: Notifies users of date/time changes

### SMS Integration
The system now supports multiple SMS providers through environment variables:

**Supported Providers:**
- **Twilio**: International, easy setup, free trial available
- **SSL Wireless**: Bangladesh local provider, good for production
- **Generic HTTP APIs**: Any REST-based SMS service

**Configuration:**
All SMS configuration is done via the `.env` file (see Setup Instructions above).

**Mock Mode:**
If no SMS provider is configured, the system runs in mock mode - SMS messages are logged to console instead of being sent. This is useful for development and testing.

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure MySQL is running (XAMPP Control Panel)
- Check credentials in `server.js` (lines 18-23)
- Default XAMPP: user=`root`, password=`` (empty)

### Email Not Sending
- Check Gmail credentials in `server.js`
- Ensure App Password is generated correctly
- Check console for email errors

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## 🔐 Security Notes

For production deployment:
- Use environment variables for credentials
- Implement password hashing (bcrypt)
- Add JWT authentication
- Validate all inputs server-side
- Use HTTPS
- Implement rate limiting
- Sanitize database queries (use parameterized queries - already done)

## 📝 License

This project is for educational purposes.

---

**Built with ❤️ by the Ayojon Team**
