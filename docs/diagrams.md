# Task Manager API — Architecture Diagrams

---

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User {
        ObjectId _id PK
        string name
        string email "unique"
        string passwordHash "select: false"
        enum role "Leader | Member | Observer"
        date createdAt
        date updatedAt
    }

    Project {
        ObjectId _id PK
        string name
        string description
        ObjectId leaderId FK
        date createdAt
        date updatedAt
    }

    ProjectMember {
        ObjectId _id PK
        ObjectId projectId FK "unique compound"
        ObjectId userId FK "unique compound"
        enum role "Leader | Member | Observer"
        date createdAt
        date updatedAt
    }

    Task {
        ObjectId _id PK
        ObjectId projectId FK
        ObjectId assignedTo FK "nullable"
        ObjectId createdBy FK
        string title
        string description
        enum priority "Low | Medium | High | Critical"
        enum status "To Do | In Progress | Blocked | Completed"
        date dueDate "nullable"
        number progress "0-100"
        date createdAt
        date updatedAt
    }

    Subtask {
        ObjectId _id PK
        ObjectId taskId FK
        string title
        enum status "To Do | Completed"
        date createdAt
        date updatedAt
    }

    Feedback {
        ObjectId _id PK
        ObjectId taskId FK
        ObjectId userId FK
        string comment
        date createdAt
    }

    Notification {
        ObjectId _id PK
        ObjectId senderId FK "nullable"
        ObjectId receiverId FK
        string type
        string message
        boolean isRead "default false"
        date createdAt
    }

    JoinRequest {
        ObjectId _id PK
        ObjectId projectId FK
        ObjectId observerId FK
        enum status "Pending | Approved | Rejected"
        date createdAt
    }

    User ||--o{ Project : "leads"
    User ||--o{ ProjectMember : "is member"
    Project ||--o{ ProjectMember : "has members"
    Project ||--o{ Task : "contains"
    User ||--o{ Task : "creates"
    User ||--o{ Task : "assigned to"
    Task ||--o{ Subtask : "has"
    Task ||--o{ Feedback : "receives"
    User ||--o{ Feedback : "writes"
    Project ||--o{ JoinRequest : "receives"
    User ||--o{ JoinRequest : "requests"
    User ||--o{ Notification : "receives"
    User ||--o{ Notification : "sends"
```

---

## 2. Sequence Diagram — Full Project Lifecycle

```mermaid
sequenceDiagram
    participant Client
    participant Auth as Auth Module
    participant Projects as Projects Module
    participant JoinReq as Join Requests
    participant Tasks as Tasks Module
    participant Subtasks as Subtasks Module
    participant Feedback as Feedback Module
    participant Notif as Notifications
    participant DB as MongoDB

    Note over Client,DB: === 1. Registration & Login ===
    Client->>Auth: POST /auth/register
    Auth->>DB: Create user
    DB-->>Auth: User document
    Auth-->>Client: { accessToken, user }

    Client->>Auth: POST /auth/login
    Auth->>DB: Find user by email
    DB-->>Auth: User + passwordHash
    Auth-->>Client: { accessToken, user }

    Note over Client,DB: === 2. Join Request (Observer) ===
    Client->>JoinReq: POST /projects/:id/join-request
    JoinReq->>DB: Check not member + no pending request
    JoinReq->>DB: Create JoinRequest (Pending)
    JoinReq->>DB: Find project Leader
    JoinReq->>Notif: Notify leader of new request
    DB-->>JoinReq: JoinRequest
    JoinReq-->>Client: Request submitted

    Note over Client,DB: === 3. Approve Request (Leader) ===
    Client->>JoinReq: PATCH /projects/:id/join-requests/:reqId
    JoinReq->>DB: Update status to Approved
    JoinReq->>DB: Upsert ProjectMember as Member
    JoinReq->>Notif: Notify observer of approval
    DB-->>JoinReq: Updated request + membership
    JoinReq-->>Client: Approved

    Note over Client,DB: === 4. Create & Assign Task (Leader) ===
    Client->>Tasks: POST /tasks { projectId, title, assignedTo }
    Tasks->>DB: Verify Leader membership
    Tasks->>DB: Create Task
    Tasks->>Notif: Notify assignee
    DB-->>Tasks: Task document
    Tasks-->>Client: Task created

    Note over Client,DB: === 5. Manage Subtasks (Member) ===
    Client->>Subtasks: POST /tasks/:id/subtasks
    Subtasks->>DB: Verify project membership
    Subtasks->>DB: Create Subtask
    DB-->>Subtasks: Subtask document
    Subtasks-->>Client: Subtask created

    Client->>Subtasks: PATCH /tasks/:id/subtasks/:subId
    Subtasks->>DB: Update status to Completed
    Subtasks->>DB: Recalculate task.progress
    DB-->>Subtasks: Updated subtask + task
    Subtasks-->>Client: Status updated

    Note over Client,DB: === 6. Leader Feedback ===
    Client->>Feedback: POST /feedback/task/:taskId
    Feedback->>DB: Verify project membership
    Feedback->>DB: Create Feedback entry
    Feedback->>Notif: Notify task assignee
    DB-->>Feedback: Feedback document
    Feedback-->>Client: Feedback posted

    Note over Client,DB: === 7. Read Notifications ===
    Client->>Notif: GET /notifications
    Notif->>DB: Find by receiverId
    DB-->>Notif: Notification list
    Notif-->>Client: [{ type, message, isRead }]
```

---

## 3. Flowchart — System & Workflow Overview

```mermaid
flowchart TB
    subgraph AuthFlow["Request Lifecycle"]
        direction LR
        R[Client Request] --> G[JwtAuthGuard]
        G -->|Valid token| C[Controller]
        G -->|Invalid / Missing| E[401 Unauthorized]
        C --> S[Service]
        S --> D[(MongoDB)]
        D --> Resp[Response JSON]
    end

    subgraph TaskLifecycle["Task Status"]
        direction TB
        TD[To Do] --> IP[In Progress]
        IP -->|Optional| BL[Blocked]
        IP -->|All subtasks completed| CO[Completed]
        BL -->|Unblocked| IP
    end

    subgraph JoinLifecycle["Join Request"]
        direction TB
        JR[Observer submits request] --> PEND{Pending}
        PEND -->|Leader approves| AP[Approved]
        PEND -->|Leader rejects| RJ[Rejected]
        AP --> MEM[Member added to project]
        AP --> NOTIF1[Notification sent]
        RJ --> NOTIF1
    end

    subgraph NotifTriggers["Notification Events"]
        N1[Task assigned] --> N
        N2[Feedback posted] --> N
        N3[Join request processed] --> N
        N4[Member added to project] --> N
        N[Create Notification]
    end
```

---

## Database Indexes

| Collection | Index | Properties |
|---|---|---|
| `users` | `email` | unique |
| `projectmembers` | `(projectId, userId)` | unique compound |
| `joinrequests` | `(projectId, observerId, status)` | covered query for pending checks |
| `notifications` | `receiverId` | sort by `createdAt` desc |
| `tasks` | `projectId` | filter by project |
| `subtasks` | `taskId` | filter + count for progress |
| `feedback` | `taskId` | filter + sort by `createdAt` asc |
