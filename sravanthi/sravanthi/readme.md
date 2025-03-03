# Task Management Application

A real-time task management application with asynchronous notifications built using Flask and TypeScript.

## Features

- ✨ Real-time task updates using Server-Sent Events (SSE)
- 📧 Asynchronous email notifications
- 🔔 Push notification support
- 🔄 Automatic reconnection for dropped SSE connections
- 📝 CRUD operations for tasks
- 🎯 TypeScript frontend with RxJS

## Project Structure

```
 project/
 ├── .gitignore                  # Root gitignore for both frontend and backend
 ├── README.md                   # Project documentation
 ├── backend/
 │   ├── .gitignore             # Backend specific gitignore
 │   ├── app/
 │   │   ├── services/
 │   │   │   └── notification_service.py
 │   │   ├── __init__.py
 │   │   └── routes.py
 │   ├── venv/
 │   ├── requirements.txt
 │   └── run.py
 └── frontend/
     ├── .gitignore             # Frontend specific gitignore
     ├── src/
     │   ├── services/
     │   │   └── task.service.ts
     │   ├── components/
     │   │   └── TaskList.ts
     │   └── index.ts
     ├── .env
     └── tsconfig.json
```

## Version Control

The repository uses multiple `.gitignore` files:

- Root `.gitignore`: Common patterns for both frontend and backend
- `frontend/.gitignore`: Frontend-specific patterns
- `backend/.gitignore`: Backend-specific patterns

This structure ensures proper exclusion of:
- Build artifacts
- Dependencies
- Environment files
- IDE configurations
- Log files
- Cache directories

## Project Structure 