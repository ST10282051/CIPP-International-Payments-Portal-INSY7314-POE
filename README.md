# CIPP-International-Payments-Portal-INSY7314-POE
Falcone CIPP International Payments Portal

The Falcone CIPP International Payments Portal is a secure, full-stack web application for managing and processing international payments.
It features a React.js frontend and a Node.js/Express backend, integrated with Firebase authentication, MongoDB data storage, and multiple security layers for protecting sensitive transactions.

Table of Contents

Overview

Architecture

Frontend

Backend

About the API

How It Works

API Summary

Environment Variables

How to Run

Security Summary

SonarQube Integration

Future Enhancements

License

Summary

Overview

Falcone CIPP allows users to register, authenticate, manage cards, and process international transactions securely.
The system was designed to ensure data privacy, real-time feedback, and protection against common web attacks.

Key Features

Secure user authentication and session management

Add, delete, and manage payment cards

Employee and customer role segregation

Transaction history and audit trails

HTTPS-based encrypted communication

Fully modular and testable Node.js backend

Architecture
Layer	Technology
Frontend	React.js
Backend	Node.js + Express
Database	MongoDB (Mongoose ORM)
Authentication	JWT + Refresh Tokens
Security	Helmet, bcrypt, Rate Limiting, CORS, Input Sanitization
Hosting	Vercel (Frontend) + Render (Backend)
Frontend
Features

Responsive React.js interface with a modern UI

Card management (add, view, delete)

Payment and SWIFT transaction forms

Axios API integration for backend communication

Error handling and visual feedback

Authentication with persistent JWT tokens

Security Layers

Client-side validation for all input fields

Secure API communication via HTTPS

Password strength enforcement

Token storage in protected context

Strict CSP and sanitized components

Backend
Features

Express REST API for users, cards, employees, and SWIFT payments

Role-based authorization for admin and customer routes

Enforced data validation using Joi schemas

Refresh token rotation for enhanced session security

Rate limiting and logging for activity monitoring

Centralized error and security handling

Security Layers

JWT Authentication: For secure stateless sessions

bcrypt Hashing: Protects user passwords at rest

Helmet: Sets security-related HTTP headers

CORS: Restricts external API access

Mongo Sanitize & XSS Clean: Prevents injection and scripting attacks

Rate Limiting: Protects from brute-force and DoS attacks

HTTPS: Ensures encrypted data transmission

About the API

The Falcone CIPP API manages all data operations and enforces business logic between the frontend and MongoDB.

Responsibilities

Authentication: Register, login, refresh, and revoke tokens

Card Management: Add, fetch, and delete stored cards

Employee Management: Role-based access to operations

SWIFT Payments: Create and validate international transactions

Validation: All data requests verified with Joi

How It Works
1. Frontend (React)

Collects and validates user input

Sends secure HTTPS requests using Axios

Stores tokens securely and renders user dashboards

2. Backend (Express + MongoDB)

Processes client requests and applies validations

Generates JWTs and refresh tokens

Logs activity and enforces user roles

3. Database (MongoDB)

Stores users, employees, cards, and transaction data

Automatically handles indexing and expiration of tokens

API Summary
Method	Endpoint	Description	Auth Required
POST	/api/auth/register	Register a new user	❌
POST	/api/auth/login	Authenticate user	❌
GET	/api/cards	Get saved cards	✅
POST	/api/cards	Add a new card	✅
DELETE	/api/cards/:id	Delete card by ID	✅
GET	/api/customers	Get customer info	✅
POST	/api/swift	Create SWIFT payment	✅
Environment Variables

Create a .env file in the project root and include the following:

PORT=8443
NODE_ENV=development
MONGO_URI=mongodb+srv://your_db_url
JWT_SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_secret
SSL_KEY_PATH=./certs/key.pem
SSL_CERT_PATH=./certs/cert.pem
CORS_ORIGINS=http://localhost:3000

How to Run
🧩 Step 1: Download the Project

Click Code → Download ZIP on the GitHub repository page.

Extract the folder to your Documents or Desktop.

Open the folder in Visual Studio Code.

⚙️ Step 2: Install Dependencies
npm install

🚀 Step 3: Run the Server
npm start


Server starts on: https://localhost:8443

🌐 Step 4: Run the Frontend

If using a separate React frontend:

cd frontend
npm install
npm start


App runs on: http://localhost:3000

SonarQube Integration

SonarQube was integrated to continuously analyze code quality, maintainability, and security vulnerabilities in the backend.
It runs automatically in the CI/CD pipeline using CircleCI.

Configuration Highlights
sonar.projectKey=Falcone-CIPP-International-Payments-Portal2020
sonar.host.url=http://localhost:9000
sonar.login=<secure_token>
sonar.sources=.
sonar.exclusions=node_modules/**
sonar.language=js
sonar.sourceEncoding=UTF-8

Purpose

Detects code smells, bugs, and vulnerable dependencies

Enforces secure coding standards

Generates test coverage and reliability metrics

This ensures that each build is tested, analyzed, and validated before deployment.

Security Summary
Threat	Mitigation
Session Jacking	JWT expiration, refresh tokens, and httpOnly cookies
Clickjacking	Helmet frameguard and CSP headers
SQL/NoSQL Injection	Mongo Sanitize and parameterized queries
XSS Attacks	xss-clean and content security policies
Man-in-the-Middle (MITM)	Enforced HTTPS + TLS 1.2+
DDoS Attacks	express-rate-limit and route throttling
Password Security	bcrypt with salting and secure token rotation
