# Grocify Frontend

A React-based frontend for the Grocify grocery management application. This application helps users track their groceries, manage expiry dates, and receive notifications about items that are about to expire.

## Features

- 🔐 **User Authentication**: Register and login with secure JWT tokens
- 📊 **Dashboard**: View all grocery items with expiry tracking
- ➕ **Add Items**: Add new grocery items with detailed information
- ✏️ **Edit Items**: Update existing item details
- 🗑️ **Use Items**: Mark items as used (archived)
- 🔍 **Filter Items**: Filter by expiry status (All, Expired, Expiring Soon, Fresh)
- 📧 **Email Notifications**: Receive alerts for items nearing expiry (backend feature)
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **React 19** - Frontend framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **Context API** - State management

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend server running (see backend README)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Environment Setup

Make sure your backend server is running on `http://localhost:5000` or update the base URL in `src/context/AuthContext.js`.

## Project Structure

```
src/
├── components/          # Reusable components
│   └── Navbar.js       # Navigation bar
├── context/            # React Context
│   └── AuthContext.js  # Authentication context
├── pages/              # Page components
│   ├── Login.js        # Login page
│   ├── Register.js     # Registration page
│   ├── Dashboard.js    # Main dashboard
│   ├── AddItem.js      # Add item form
│   └── EditItem.js     # Edit item form
├── App.js              # Main app component
└── index.js            # App entry point
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## API Endpoints

The frontend communicates with the following backend endpoints:

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /items` - Get all items for the user
- `POST /items` - Add a new item
- `PUT /items/:id` - Update an item
- `DELETE /items/:id` - Mark item as used

## Features in Detail

### Authentication
- Secure JWT-based authentication
- Automatic token storage in localStorage
- Protected routes for authenticated users

### Dashboard
- Grid layout showing all grocery items
- Color-coded expiry status indicators
- Filter buttons to view items by status
- Quick actions (Edit, Use) for each item

### Item Management
- Comprehensive form for adding items
- Support for both direct expiry dates and shelf life calculation
- Predefined item types (Dairy, Fruits, Vegetables, etc.)
- Form validation and error handling

### Responsive Design
- Mobile-first approach
- Responsive grid layout
- Touch-friendly interface
- Optimized for all screen sizes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Grocify application suite.
