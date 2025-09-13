# Grocify - Complete Setup Guide

## 🚀 Quick Start

Your Grocify application is now ready! Here's how to get everything running:

### 1. Database Setup
Run the schema file in your PostgreSQL database:
```sql
-- Execute the contents of backend/schema.sql in your PostgreSQL database
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a `.env` file with your configuration:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
   JWT_SECRET=your_super_secret_jwt_key_here
   SENDGRID_API_KEY=your_sendgrid_api_key
   FROM_EMAIL=your_email@example.com
   PORT=5000
   ```

3. Install dependencies and start the server:
   ```bash
   npm install
   node index.js
   ```

### 3. Frontend Setup
1. The frontend is already running on `http://localhost:3000`
2. If you need to restart it:
   ```bash
   cd frontend
   npm start
   ```

## 🎯 What's Ready

### ✅ Backend Features
- **User Authentication**: Register/Login with JWT tokens
- **CRUD Operations**: Add, view, edit, delete grocery items
- **Expiry Tracking**: Smart expiry date calculation
- **Email Notifications**: Automated alerts for expiring items
- **Database Triggers**: Automatic archiving of used items

### ✅ Frontend Features
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Authentication Pages**: Login and registration forms
- **Dashboard**: View all items with expiry status
- **Item Management**: Add, edit, and mark items as used
- **Filtering**: Filter by expiry status (All, Expired, Expiring Soon, Fresh)
- **Real-time Updates**: Automatic refresh after actions

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/grocify_db

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_here

# SendGrid (for email notifications)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=your_email@example.com

# Server
PORT=5000
```

## 📱 How to Use

1. **Register/Login**: Create an account or sign in
2. **Add Items**: Click "Add Item" to add groceries
3. **Track Expiry**: Items are automatically categorized by expiry status
4. **Manage Items**: Edit details or mark items as used
5. **Get Notifications**: Receive email alerts for expiring items

## 🎨 Features Overview

### Dashboard
- Color-coded expiry status indicators
- Filter buttons for different item states
- Quick actions for each item
- Responsive grid layout

### Item Management
- Comprehensive form with all necessary fields
- Support for both direct expiry dates and shelf life calculation
- Predefined item types (Dairy, Fruits, Vegetables, etc.)
- Form validation and error handling

### Authentication
- Secure JWT-based authentication
- Automatic token storage
- Protected routes
- User-specific data isolation

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your `DATABASE_URL` in `.env`
   - Ensure PostgreSQL is running
   - Verify database exists

2. **Frontend Not Loading**
   - Check if backend is running on port 5000
   - Verify CORS settings
   - Check browser console for errors

3. **Authentication Issues**
   - Ensure JWT_SECRET is set
   - Check token expiration
   - Verify email/password format

### Development Tips

- Backend runs on: `http://localhost:5000`
- Frontend runs on: `http://localhost:3000`
- Database schema is in: `backend/schema.sql`
- API endpoints are documented in the backend routes

## 🎉 You're All Set!

Your Grocify application is now complete and ready to use. The frontend provides a beautiful, user-friendly interface for managing groceries, while the backend handles all the business logic, database operations, and automated notifications.

Happy grocery managing! 🛒✨


