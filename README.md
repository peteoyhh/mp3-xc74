# MP3: APIed Piper

**Course:** CS 409 Fall 2025  
**Author:** Pete Chen  
**Project:** MP #3 — Task Management REST API

---

## Overview

This project implements a fully functional RESTful API for a task management application, **Llama.io**, built using **Node.js**, **Express**, and **Mongoose**.

The API supports CRUD operations for both **Users** and **Tasks**, complete with query string filtering, pagination, and two-way reference integrity between users and their assigned tasks.

---

## Deployment

- **Render URL:** [https://mp3-xc74.onrender.com](https://mp3-xc74.onrender.com)
- **MongoDB Atlas Cluster:** Connected remotely (IP Whitelist: Allow access from anywhere)

---

## Endpoints

### 🧍 Users
| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/users` | Get all users (supports `where`, `sort`, `select`, `skip`, `limit`, `count`) |
| POST | `/api/users` | Create a new user |
| GET | `/api/users/:id` | Get details of a specific user |
| PUT | `/api/users/:id` | Update user details and pending tasks |
| DELETE | `/api/users/:id` | Delete user and unassign their pending tasks |

### ✅ Tasks
| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/tasks` | Get all tasks (supports `where`, `sort`, `select`, `skip`, `limit`, `count`) |
| POST | `/api/tasks` | Create a new task |
| GET | `/api/tasks/:id` | Get details of a specific task |
| PUT | `/api/tasks/:id` | Update task fields or reassign to another user |
| DELETE | `/api/tasks/:id` | Delete task and remove from user’s pendingTasks |

---

## Example Queries

| Query | Description |
|--------|--------------|
| `/api/tasks?where={"completed":true}` | Get all completed tasks |
| `/api/users?sort={"name":1}` | Get users sorted alphabetically |
| `/api/tasks?skip=20&limit=10` | Paginate tasks (tasks #21–30) |
| `/api/users?select={"_id":0,"email":1}` | Get only user emails |
| `/api/tasks?where={"assignedUserName":"unassigned"}` | Get all unassigned tasks |

---

## Validation Rules

### Users
- Must include `name` and `email`
- Email must be unique
- Automatically adds `dateCreated`
- Automatically updates assigned tasks when user changes or is deleted

### Tasks
- Must include `name` and `deadline`
- Default values:
  - `completed`: `false`
  - `assignedUser`: `""`
  - `assignedUserName`: `"unassigned"`
- Automatically syncs user references on creation, update, or deletion

---

## HTTP Response Format

All responses follow the same structure:
```json
{
  "message": "OK",
  "data": { ... }
}
```

Example (GET `/api/tasks/:id`):
```json
{
  "message": "OK",
  "data": {
    "_id": "64f993a2d7a64f01ec47b1a9",
    "name": "Organize project files",
    "completed": false,
    "assignedUserName": "unassigned"
  }
}
```

---

## Status Codes

| Code | Meaning |
|------|----------|
| 200 | Success |
| 201 | Resource created |
| 204 | No content |
| 400 | Bad request |
| 404 | Not found |
| 500 | Server error |

---

## Scripts

| Command | Description |
|----------|-------------|
| `npm install` | Install dependencies |
| `npm start` | Start server locally |
| `npm run dev` | Start with nodemon (for development) |
| `python3 database_scripts/dbClean.py` | Remove all users & tasks |
| `python3 database_scripts/dbFill.py -u "localhost" -p 3000 -n 20 -t 100` | Populate database with test data |

---

## Tech Stack
- **Node.js**
- **Express**
- **MongoDB Atlas**
- **Mongoose**
- **Render** (deployment)
- **Postman** (testing)

---

## Notes
- `.env` file contains:
  ```
  MONGODB_URI=your_connection_string_here
  PORT=3000
  ```
- `.env` is listed in `.gitignore` to prevent accidental exposure.

---

**Deployed & Verified:** All endpoints tested via Postman and Render (200/201/404/500 verified).  
