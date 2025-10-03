# Review Restaurant

## this project is review restaurant around KMITL PCC

A full-stack web application for restaurant reviews.

## Project Structure

- **frontend/** – React Router + Vite + TailwindCSS frontend
- **backend/** – Express.js TypeScript express API

## Features

- Modern React frontend with server-side rendering
- TailwindCSS for styling
- Express.js backend API
- TypeScript throughout
- Docker support for both frontend and backend

## Getting Started

### Easy start

1. Set .env file

2. Run Frontend and Backend from docker

   ```sh
   docker-compose up -d --build
   ```

### Prerequisites

- Node.js (v18+ for backend, v20+ for frontend recommended)
- npm

### Installation

Install dependencies for both frontend and backend:

```sh
cd backend
npm install

cd ../frontend
npm install
```

### Development

#### Backend

```sh
cd backend
npm run dev
```

#### Frontend

```sh
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- n8n : http://localhost:5678/

### Building for Production

#### Backend

```sh
cd backend
npm run build
```

#### Frontend

```sh
cd frontend
npm run build
```

### Docker

You can build and run both frontend and backend using Docker:

#### Frontend

```sh
cd frontend
docker build -t review-restaurant-frontend .
docker run -p 3000:3000 review-restaurant-frontend
```

#### Backend

```sh
cd backend
docker build -t review-restaurant-backend .
docker run -p 3000:3000 review-restaurant-backend
```

### ollama 
docker exec ollama ollama pull llama3.2 

## Sequence Diagram

### Authentication

#### Sign Up

```mermaid
sequenceDiagram
    actor User
    participant Email
    participant Frontend
    participant Backend
    participant Database
    User->>Frontend: register
    Frontend->>Backend: register step 1

    alt User exists
        Backend-->>Frontend: Email already exist
        Frontend-->>User: Email already exist
    else User not exists
        Email->>User: OTP
    end

    User->>Frontend: verify OTP
    Frontend->>Backend: OTP

    alt OTP verfiy
        Backend->>Database: Create new user
        Backend->>Frontend: Create success
        Frontend-->>User: Create success
    else OTP incorrect
        Backend-->>Frontend: OTP incorrect
        Frontend-->>User: OTP incorrect
    end

```

#### Sign In, Sign Out

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Sign in with website account
    Frontend->>Backend: username, password
    Backend->>Database: Check username and password

    alt Username,Password Correct
        Database-->>Backend: return User data
        Backend-->>Frontend: Sign in success
        Frontend-->>User: Sign success
    else Username,Password Incorrect
        Backend-->>Frontend: Sign in fail
        Frontend-->>User: Sign in fail
    end

    User->>Frontend: Sign in with google account
    Frontend->>Backend: Sign in with google
    Backend->>Google: redirect to google
    Google->>User: access account
    Google->>User: sign in success

    User->>Frontend: Sign out
    Frontend->>Backend: Sign out
    Backend-->>Frontend: Sign out success
    Frontend-->>User: Sign out success

```

### Restaurant

```mermaid
sequenceDiagram
    actor User
    actor Restaurant Owner
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: watch restaurant page
    Frontend->>Backend: request restaurants
    Backend->>Database: query restaurants data
    Database-->>Backend: return restaurants data
    Backend-->>Frontend: return restaurants data
    Frontend-->>User: show restaurants

    User->>Frontend: click one restaurant
    Frontend->>Backend: request restaurant
    Backend->>Database: query restaurant data
    Database-->>Backend: return restaurant data
    Backend-->>Frontend: return restaurant data
    Frontend-->>User: show restaurant

    Restaurant Owner->>Frontend: edit restaurant
    Frontend->>Backend: send data restaurant
    Backend->>Database: update restaurant data
```

### Review

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: review restaurant
    Frontend->>Backend: send review data
    Backend->>Database: query restaurant
    Database-->>Backend: return restaurant
    Backend->>Backend: Calculate rating
    Backend->>Database: save review
    Backend-->>Frontend: success review
    Frontend-->>User: success review
```

## License

MIT

---

Built with ❤️ using React, Express, and
