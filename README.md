# Collaborative Team Task Management System

A collaborative, role-based project and task management web application designed to help teams organize projects, assign tasks, track progress, and communicate efficiently. This project features built-in email and in-app notifications, subtask-driven progress tracking, and leader feedback loops.

---

## 🚀 Project Overview

The **Team Task Management System** provides structured project tracking with specific user roles, ensuring secure and effective team collaboration. 

### Core Features:
- **Role-Based Access Control (RBAC):** Three distinct roles (Team Leader, Member, Observer) with customized workspaces and capabilities.
- **Dynamic Task Progress:** Task progress is automatically computed based on the completion of subtasks.
- **Feedback & Commenting:** Interactive communication channel between Team Leaders and Members.
- **Automated Notifications:** Dual notification delivery (in-app and via email) triggering on important workflow changes.
- **Join Requests:** Observers can request to join projects as active Members.

---

## 👥 User Roles & Permissions

### 👑 1. Team Leader (Project Manager)
The Project Manager holds administrative privileges over their projects.
* **Project Control:** Create, edit, and delete tasks; manage project membership and observers.
* **Task Assignment:** Assign tasks to team members, set deadlines (due dates), and define priority levels (`Low`, `Medium`, `High`, `Critical`).
* **Progress Tracking:** Review task completion percentages and overall project metrics.
* **Feedback Loops:** Provide comments, approval, or feedback on member tasks.
* **Collaboration:** Invite new members via email and approve/reject observer requests to join.

### 🛠️ 2. Member
Members are the action-takers responsible for executing and completing tasks.
* **My Tasks:** View and manage tasks assigned directly to them.
* **Subtasks Management:** Create, toggle, and delete subtasks to break down parent tasks.
* **Progress Automation:** Update parent tasks by completing subtasks (overall task progress updates automatically).
* **Communication:** Update status (`To Do` ➔ `In Progress` ➔ `Blocked` ➔ `Completed`), read leader feedback, and post comment updates.

### 👁️ 3. Observer
Observers have a high-level view of project status and timeline.
* **Read-Only Access:** View project tasks, detailed statuses, and general progress.
* **No Mutative Access:** Cannot edit, assign, delete, or create tasks/subtasks.
* **Join Requests:** Can send requests to the Team Leader to be promoted to an active project **Member**.

---

## 🔄 Workflows

### Task Status Lifecycle
```
[ To Do ]  ➔  [ In Progress ]  ➔  [ Blocked ] (Optional)  ➔  [ Completed ]
```

### Overall Project Lifecycle
```
Create Project ➔ Invite Members ➔ Assign Tasks ➔ Members Create Subtasks ➔ Subtask Updates Drive Task Progress ➔ Leader Reviews & Gives Feedback ➔ Tasks Completed ➔ Project Finished
```

---

## 🛠️ Technology Stack

This project is built using a modern, scalable backend architecture:
- **Framework:** [NestJS](https://nestjs.com/) (Node.js framework)
- **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose ODM](https://mongoosejs.com/)
- **Authentication:** Passport.js with JWT Strategy (`@nestjs/jwt` & `passport-jwt`)
- **Email Service:** [Nodemailer](https://nodemailer.com/) with NestJS Mailer module
- **Validation:** `class-validator` and `joi` for environment verification
- **Logging:** Structured logging using `nestjs-pino` and `pino-http`

---

## 📊 Database Models (Entities)

The database schema includes the following primary entities:

### 1. User
- `UserID` (ObjectId, Primary Key)
- `Name` (String)
- `Email` (String, Unique)
- `Password` (String, Hashed)
- `Role` (Enum: `Leader`, `Member`, `Observer`)

### 2. Project
- `ProjectID` (ObjectId, Primary Key)
- `Name` (String)
- `Description` (String)
- `LeaderID` (ObjectId ➔ User)
- `CreatedAt` (Date)

### 3. ProjectMember
- `ProjectID` (ObjectId ➔ Project)
- `UserID` (ObjectId ➔ User)
- `Role` (Enum: `Leader`, `Member`, `Observer`)

### 4. Task
- `TaskID` (ObjectId, Primary Key)
- `ProjectID` (ObjectId ➔ Project)
- `AssignedTo` (ObjectId ➔ User, Optional)
- `CreatedBy` (ObjectId ➔ User)
- `Title` (String)
- `Description` (String)
- `Priority` (Enum: `Low`, `Medium`, `High`, `Critical`)
- `Status` (Enum: `To Do`, `In Progress`, `Blocked`, `Completed`)
- `DueDate` (Date)
- `Progress` (Number: `0` to `100` - calculated dynamically from subtasks)
- `CreatedAt` (Date)
- `UpdatedAt` (Date)

### 5. Subtask
- `SubtaskID` (ObjectId, Primary Key)
- `TaskID` (ObjectId ➔ Task)
- `Title` (String)
- `Status` (Enum: `To Do`, `Completed`)

### 6. Feedback
- `FeedbackID` (ObjectId, Primary Key)
- `TaskID` (ObjectId ➔ Task)
- `LeaderID` (ObjectId ➔ User)
- `MemberID` (ObjectId ➔ User)
- `Comment` (String)
- `CreatedAt` (Date)

### 7. Notification
- `NotificationID` (ObjectId, Primary Key)
- `SenderID` (ObjectId ➔ User, Optional)
- `ReceiverID` (ObjectId ➔ User)
- `Type` (String)
- `Message` (String)
- `IsRead` (Boolean, Default: `false`)
- `CreatedAt` (Date)

### 8. JoinRequest
- `RequestID` (ObjectId, Primary Key)
- `ProjectID` (ObjectId ➔ Project)
- `ObserverID` (ObjectId ➔ User)
- `Status` (Enum: `Pending`, `Approved`, `Rejected`)
- `RequestedAt` (Date)

---

## 🛣️ API Endpoints Roadmap

Below is the planned RESTful API surface for the Team Task Management application:

### Authentication & Users (`/api/auth`)
- `POST /register` - Register a new user
- `POST /login` - Login and receive JWT token
- `GET /me` - Retrieve current logged-in user profile

### Projects (`/api/projects`)
- `POST /` - Create a new project *(Leader only)*
- `GET /` - List all projects user is involved in
- `GET /:id` - Get project details *(Leader, Member, Observer)*
- `POST /:id/invite` - Invite a user to the project *(Leader only)*
- `POST /:id/join-request` - Submit request to join a project *(Observer only)*
- `GET /:id/join-requests` - List all pending join requests *(Leader only)*
- `PATCH /:id/join-requests/:requestId` - Approve/Reject join request *(Leader only)*

### Tasks & Subtasks (`/api/tasks`)
- `POST /` - Create a new task in a project *(Leader only)*
- `GET /project/:projectId` - Get tasks by project
- `PATCH /:id` - Update task details *(Leader: all fields, Member: status)*
- `DELETE /:id` - Delete a task *(Leader only)*
- `POST /:id/subtasks` - Create a subtask *(Member/Leader)*
- `PATCH /:id/subtasks/:subtaskId` - Update subtask status *(Member/Leader)*
- `DELETE /:id/subtasks/:subtaskId` - Remove a subtask *(Member/Leader)*

### Feedback & Comments (`/api/feedback`)
- `POST /task/:taskId` - Add leader feedback or member comment on a task
- `GET /task/:taskId` - Fetch comments/feedback trail

### Notifications (`/api/notifications`)
- `GET /` - Get all user notifications (reads & unreads)
- `PATCH /:id/read` - Mark a specific notification as read

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory by copying the `.env.example` file and filling in the values:

```bash
PORT=3000
MONGO_URI=your_mongodb_connection_uri
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d

# Email Notification Settings
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_smtp_username
MAIL_PASS=your_smtp_password
MAIL_FROM="Team Task Manager <no-reply@taskmanager.com>"
```

---

## 🏁 Installation & Development

### Prerequisite
Make sure you have [Node.js](https://nodejs.org/) (v18+) and [MongoDB](https://www.mongodb.com/) installed and running.

### 1. Install Dependencies
```bash
$ npm install
```

### 2. Configure Environment
Copy the example environment configuration and edit the settings.
```bash
$ cp .env.example .env
```

### 3. Run the Application
```bash
# development mode
$ npm run start

# watch mode (highly recommended for development)
$ npm run start:dev

# production mode
$ npm run start:prod
```

### 4. Run Tests
```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

---

## 📝 License
This project is licensed under the [MIT License](LICENSE).
