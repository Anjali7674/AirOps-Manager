# ✈️ AirOps Manager – Airline Management System

AirOps Manager is a full-stack Airline Management System designed to manage airline operations through a web-based application. It provides functionality for managing flights, passengers, bookings, tickets, airports, schedules, and other airline-related operations.

The project follows a client-server architecture with a React.js frontend, Node.js backend, REST APIs, and a MySQL database.

## 📌 Project Overview

AirOps Manager provides a centralized platform for managing airline-related operations and information.

The system includes different modules for flight management, booking management, passenger/client management, airport information, schedules, tickets, reviews, and flight status.

## 🚀 Features

* ✈️ Flight management
* 🛫 Airport management
* 🎫 Flight booking management
* 👤 Passenger/Client management
* 🎟️ Ticket management
* 📅 Flight schedule management
* 🔍 Flight search functionality
* 📊 Flight status management
* 🚪 Gate management
* ⭐ Review management
* 🔐 Authentication and authorization
* 🛡️ Request validation
* ⚡ Rate limiting
* 🔗 REST API integration
* 🗄️ MySQL database integration
* 🌐 Responsive web interface

## 🛠️ Tech Stack

### Frontend

* React.js
* JavaScript
* HTML
* CSS

### Backend

* Node.js
* Express.js
* REST APIs
* MySQL2

### Database

* MySQL

### Testing

* End-to-End (E2E) Testing

### Tools

* Git
* GitHub
* VS Code
* Vercel

## 📂 Project Structure

```text
AirOpsManager/
│
├── client/                    # React frontend
│   ├── src/
│   └── ...
│
├── server/                    # Node.js backend
│   ├── db/
│   │   └── pool.js            # MySQL database connection
│   │
│   ├── middleware/
│   │   ├── auth.js            # Authentication middleware
│   │   ├── ratelimiter.js     # Rate limiting
│   │   └── validate.js        # Request validation
│   │
│   ├── routes/
│   │   ├── airplanes.js
│   │   ├── airports.js
│   │   ├── auth.js
│   │   ├── bookings.js
│   │   ├── clients.js
│   │   ├── flights.js
│   │   ├── flightStatus.js
│   │   ├── gates.js
│   │   ├── reviews.js
│   │   ├── schedules.js
│   │   ├── search.js
│   │   └── tickets.js
│   │
│   └── ...
│
├── e2e/                       # End-to-end tests
├── .gitignore
├── vercel.json                # Vercel configuration
└── README.md
```

## ⚙️ How to Run the Project

### 1. Clone the Repository

```bash
git clone https://github.com/Anjali7674/AirOps-Manager.git
```

### 2. Open the Project

```bash
cd AirOps-Manager
```

### 3. Install Frontend Dependencies

```bash
cd client
npm install
```

### 4. Start the Frontend

```bash
npm start
```

### 5. Install Backend Dependencies

Open a new terminal and navigate to the server directory:

```bash
cd server
npm install
```

### 6. Configure Environment Variables

Create a `.env` file inside the `server` directory.

Add your MySQL database configuration:

```env
DB_HOST=your_host
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
DB_SSL=false
```

### 7. Start the Backend

```bash
npm start
```

The frontend and backend can then communicate through the configured REST APIs.

## 🔗 API Modules

The backend provides API routes for different airline operations, including:

* Authentication
* Airplanes
* Airports
* Flights
* Flight bookings
* Clients
* Flight status
* Gates
* Reviews
* Schedules
* Search
* Tickets

## 🔮 Future Enhancements

* Online payment integration
* Real-time flight status updates
* Email/SMS booking notifications
* Advanced admin dashboard
* Role-based access control
* Cloud deployment improvements
* Advanced flight search and filtering
* Analytics and reporting dashboard

## 👩‍💻 Author

**Anjali Sharma**

B.Tech Information Technology
Amity University Madhya Pradesh

### 🔗 GitHub

https://github.com/Anjali7674
