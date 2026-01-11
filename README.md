# Tournament Management System

## 📌 Overview

A full-stack web application for managing tournaments, teams, players, matches, schedules, and notifications. The system provides an admin-friendly interface to create and manage tournaments while allowing users to view schedules, match details, and tournament information.

This project follows a **client–server architecture**, with a React frontend and a Node.js backend.

---

## 🛠 Tech Stack

### Frontend (Client)

* React
* Vite
* Tailwind CSS
* Axios

### Backend (Server)

* Node.js
* Express.js
* MongoDB (Mongoose)
* Nodemailer (Email notifications)
* Stripe (Payments)

---

## 📂 Project Structure

```
root/
├── client/        # Frontend (React)
├── server/        # Backend (Node / Express)
└── README.md      # Project documentation
```

---

## ⚙️ Installation

### Prerequisites

* Node.js (v18+ recommended)
* npm or yarn
* MongoDB (local or cloud)

---

## ▶️ Running the Project

### 1️⃣ Start the Backend (Server)

```bash
cd server
npm install
npm run dev
```

The server will run on:

```
http://localhost:5000
```

---

### 2️⃣ Start the Frontend (Client)

```bash
cd client
npm install
npm run dev
```

The client will run on:

```
http://localhost:5173
```

---

## 🔐 Environment Variables

Create a `.env` file inside the **server** folder and add the following:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL = http://localhost:3000
JWT_EXPIRES_IN = 5h
REFRESH_TOKEN_EXPIRES_IN = 7d
SECURITY_KEY_JWT = xxxxxx
REFRESH_KEY_JWT = xxxxxx

EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
STRIPE_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
  NODE_ENV=production or development

```

Create a `.env` file inside the **client** folder and add the following:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```


```


⚠️ Never commit `.env` files to version control.

---

## ✨ Features

* Tournament creation and management
* Team and player registration
* Match scheduling and results
* PDF and view-based match sorting
* Email notifications
* Secure payments with Stripe
* Admin and user roles

---

## 🚀 Deployment

* Frontend can be deployed on **Vercel / Netlify**
* Backend can be deployed on **Render / Railway / AWS**
* MongoDB Atlas recommended for production database

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👤 Author

**Amal Jose**  
Full Stack / iOS Developer

---

⭐ If you like this project, don’t forget to give it a star on GitHub!
