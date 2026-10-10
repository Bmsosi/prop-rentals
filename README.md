
```markdown
# 🏠 Rental Management System

A full-stack rental management web app for landlords and tenants.
Built with **React (Vite + Tailwind + Shadcn UI)** on the frontend, and **Node.js (Express + Prisma + PostgreSQL)** on the backend.  

---

## 📌 Features (Planned by Milestones)

- User Authentication (register, login, reset password)
- Landlords can create and manage property listings
- Tenants can view listings and submit applications
- Lease management (create, upload, expiry tracking)
- Payments & accounting (rent, deposits, reminders)
- Maintenance requests with media uploads
- Analytics dashboard for landlords
- Notifications, reviews, insurance tracking

---

## ⚙️ Tech Stack

### Frontend
- React (Vite)
- TailwindCSS + Shadcn/UI
- React Router
- Zustand (state management)
- Tanstack Query (server state)
- Axios (API requests)

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Bcrypt (password hashing)
- Zod (validation)
- Nodemon (dev)

### DevOps
- Docker & Docker Compose

---

## 📂 Project Structure

```

RENTAL-MANAGAMENT/
│── client/        # Frontend (React + Vite)
│   ├── src/
│   ├── public/
│   └── package.json
│
│── server/        # Backend (Express + Prisma + Postgres)
│   ├── prisma/            # Prisma schema & migrations
│   ├── src/
│   │   ├── routes/        # Express routes
│   │   ├── controllers/   # Request handling
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # JWT / validation
│   │   ├── utils/         # Helpers
│   │   └── prisma/        # Prisma client wrapper
│   ├── .env
│   ├── package.json
│   └── server.js
│
│── docker-compose.yml     # Runs backend + database
│── README.md

````

---

## 🚀 Getting Started

### 1. Clone repo
```bash
git clone https://github.com/demilade111/Rental-management.git
cd rental-management
````

---

### 2. Backend Setup (Server)

```bash
cd server
npm install
```

Create `.env` file in `server/`:

```env

# Connect to Supabase via connection pooling
DATABASE_URL="postgresql://postgres.ovdextewcgxjjngyallq:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection to the database. Used for migrations
DIRECT_URL="postgresql://postgres.ovdextewcgxjjngyallq:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"

PORT=5000
JWT_SECRET=supersecretkey
```

Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

Start dev server:

```bash
npm run dev
```

Server runs at → [http://localhost:5000](http://localhost:5000)

---

### 3. Frontend Setup (Client)

```bash
cd client
npm install
npm run dev
```

Frontend runs at → [http://localhost:5173](http://localhost:5173)

---

### 4. Docker Setup (Backend + Postgres)

From project root:

```bash
docker-compose up --build
```

* Backend → [http://localhost:5000](http://localhost:5000)
* Postgres → `localhost:5432` (user: `postgres`, pass: `postgres`, db: `rentaldb`)

---

## 🧪 API Testing

Use [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/):



---

## 👨‍💻 Development Workflow

1. Create feature branch → `git checkout -b feature/auth`
2. Make changes in `client/` or `server/`
3. Run locally → `npm run dev`
4. Push & open PR

---


