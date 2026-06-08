# API Endpoints

Base URL:

```text
Description: Create a new user account. Required fields: `email`, `password`, `username`, `name`. Optional `managerId`.
```

**Authorization Required**

### Response

Description: Authenticate user and return `accessToken` (also sets `refreshToken` cookie).
{
  "year": 2026,
  "balances": [
    { "leaveType": "CASUAL", "allocated": 12, "carriedForward": 0, "used": 2, "remaining": 10 },
    { "leaveType": "PRIVILEGE", "allocated": 15, "carriedForward": 0, "used": 0, "remaining": 15 },
    { "leaveType": "SICK", "allocated": 10, "carriedForward": 0, "used": 0, "remaining": 10 }

Description: Exchange a valid `refreshToken` cookie for a new `accessToken`.
  ]
}
```

---


Description: Retrieve public details for the specified user by `userId`.
## Get Leave History

**GET** `/api/leaves/history`

### Query Parameters


Description: Returns a list of employees visible to the caller (manager-scoped).
| Parameter | Description  |
| --------- | ------------ |
| status    | Leave status |
| managerId | Manager ID   |
| startDate | Start date   |
| endDate   | End date     |

Description: Update an employee's manager using the employee's email and new `managerId`.
| type      | Leave type   |

### Example

```http
GET /api/leaves/history?status=PENDING&managerId=22222222-2222-2222-2222-222222222222&startDate=2026-06-15&endDate=2026-06-19&type=CASUAL

Description: Delete a user by their `userId` (requires appropriate role).
```

**Authorization Required**

---

## Get Pending Leave Requests

**GET** `/api/leaves/requests/pending`

### Query Parameters

| Parameter  | Description  |
| ---------- | ------------ |
| status     | Leave status |
| startDate  | Start date   |
| endDate    | End date     |
| employeeId | Employee ID  |

### Example

```http
GET /api/leaves/requests/pending?status=PENDING&startDate=2026-06-15&endDate=2026-06-19&employeeId=22222222-2222-2222-2222-222222222222
```

**Authorization Required**

---

## Approve Leave

**PATCH** `/api/leaves/{leaveId}/approve`

### Request Body

```json
{
  "comment": "workload is high"
}
```

### Example

```http
PATCH /api/leaves/6a1ed2d5481cde6cb05851cd/approve
```

**Authorization Required**

---

## Reject Leave

**PATCH** `/api/leaves/{leaveId}/reject`

### Request Body

```json
{
  "comment": "workload is high"
}
```

### Example

```http
PATCH /api/leaves/6a1ed2d5481cde6cb05851cd/reject
```

**Authorization Required**

---

# Health APIs

## Gateway Health Check

**GET** `/health/services`

Returns the status of registered services discovered through Consul.

### Example

```http
GET /health/services
```

---

# Event-Driven Workflows

## User Registration Flow

```text
User Registration
       ↓
User Service
       ↓
UserCreated Event
       ↓
RabbitMQ
       ↓
Leave Service
       ↓
Initialize Leave Balance
```

---

## Notification Flow

```text
User Service / Leave Service
               ↓
          RabbitMQ
               ↓
     Notification Service
               ↓
        Send Notification
```

---

## Postman Collection

This `endpoints.md` is a concise reference. For the complete set of requests, example bodies, and recorded responses, import the Postman collection located at `docs/postman/LEAVE MANAGEMENT.postman_collection.json` into Postman.

If you want, I can expand this file to include every request verbatim from the collection (method, full path, description, example request/response). Say "yes" and I'll append them all.

---

## Expanded: Leave endpoints (from Postman collection)

### Apply Leave

**POST** `/api/leaves/apply`

Description: Create a leave request for the authenticated user. Validates request body and returns created leave with user details and `weekendInfo`.

Request Body:

```json
{
  "type": "CASUAL",
  "startDate": "2026-06-16",
  "endDate": "2026-06-16",
  "reason": "family function"
}
```

Example Success Response (201):

```json
{
  "employeeId": "e4e65a4b-7bc5-485f-bcfb-ac9683635138",
  "email": "demo@gmail.com",
  "name": "demo doe",
  "type": "CASUAL",
  "startDate": "2026-06-16T00:00:00.000Z",
  "endDate": "2026-06-16T00:00:00.000Z",
  "numberOfDays": 1,
  "reason": "family function",
  "reportingManager": null,
  "status": "PENDING",
  "_id": "6a2624b42b4795fea3030f0a",
  "weekendInfo": { "hasWeekends": false, "weekendDaysCount": 0, "skippedDates": [], "workingDaysApprovalCount": 1 }
}
```

Validation Error (400): missing/invalid fields — returns details in response body.

---

### Approve Leave

**PATCH** `/api/leaves/{leaveId}/approve`

Description: Approve a pending leave. Only reporting managers (or admins where allowed) can approve. Provide optional `comment` in body.

Request Body:

```json
{ "comment": "workload is high" }
```

Example Success Response (200):

```json
{
  "_id": "6a1ed83670616b54b197d3a7",
  "employeeId": "c6659de2-e98b-4193-91c6-37ca0eb4700d",
  "status": "APPROVED",
  "reviewComment": "workload is high",
  "reviewedAt": "2026-06-08T02:38:31.582Z"
}
```

Errors:
- 401 Unauthorized: invalid or expired token
- 403 Forbidden: insufficient role or not the reporting manager

---

### Reject Leave

**PATCH** `/api/leaves/{leaveId}/reject`

Description: Reject a pending leave. Only eligible managers or admins can reject. Provide a `comment` describing reason.

Request Body:

```json
{ "comment": "workload is high" }
```

Example Success Response (200):

```json
{
  "_id": "6a1ed83670616b54b197d3a7",
  "employeeId": "c6659de2-e98b-4193-91c6-37ca0eb4700d",
  "status": "REJECTED",
  "reviewComment": "workload is high",
  "reviewedAt": "2026-06-08T02:37:42.423Z"
}
```

Errors:
- 400 Bad Request: only pending leaves can be rejected
- 403 Forbidden: insufficient role or not the reporting manager

---

### Cancel Leave

**PATCH** `/api/leaves/{leaveId}/cancel`

Description: Cancel a leave request. Users can cancel their own pending leave requests.

Example Success Response (200):

```json
{
  "_id": "6a2624b42b4795fea3030f0a",
  "employeeId": "e4e65a4b-7bc5-485f-bcfb-ac9683635138",
  "status": "CANCELLED",
  "reviewComment": "Cancelled by employee",
  "reviewedAt": "2026-06-08T02:20:20.812Z"
}
```

Errors:
- 403 Forbidden: cannot cancel others' leaves
- 400 Bad Request: only pending leaves can be cancelled

---

### Pending Team Leaves

**GET** `/api/leaves/requests/pending`

Description: Retrieve pending leave requests for a manager's team (supports pagination and filters).

Query parameters:
- `status` (e.g., PENDING)
- `startDate`, `endDate`
- `employeeId` (optional)
- `page`, `limit` (pagination)

Example Success Response (200):

Response: array of leave objects with embedded `employeeDetails` and pagination when requested.

---

### Leave History

**GET** `/api/leaves/history`

Description: Query past leaves with filters (status, managerId, type, date range). Returns `leaves`, `total`, `page`, `limit`.

Example Success Response (200):

```json
{
  "leaves": [ /* array of leave objects */ ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

## Expanded: User & Auth endpoints (from Postman collection)

### Register

**POST** `/api/users/auth/register`

Description: Create a new user account. Required fields: `email`, `password`, `username`, `name`. Optional `managerId`.

Request Body Example:

```json
{
  "email": "demo@gmail.com",
  "password": "12345678",
  "username": "demo123",
  "name": "demo doe"
}
```

Responses:
- 201 Created: "User registered successfully"
- 409 Conflict: "Email or username already exists"
- 400 Bad Request: validation errors

---

### Login

**POST** `/api/users/auth/login`

Description: Authenticate user and return `accessToken` (also sets `refreshToken` cookie).

Request Body Example:

```json
{ "email": "manager@company.com", "password": "manager123" }
```

Responses:
- 200 OK: `{ "accessToken": "..." }` and `refreshToken` cookie
- 401 Unauthorized: invalid credentials
- 400 Bad Request: missing fields

---

### Refresh Token

**GET** `/api/users/auth/refresh-token`

Description: Exchange a valid refresh cookie for a new `accessToken`.

Responses:
- 200 OK: `{ "accessToken": "..." }`
- 429 Too Many Requests: rate limiter on auth endpoints

---

### Get Profile

**GET** `/api/users/profile`

Description: Returns the authenticated user's profile details.

Example Success Response (200):

```json
{
  "email": "manager@company.com",
  "employeeId": "11111111-1111-1111-1111-111111111111",
  "role": "MANAGER",
  "username": "manager_admin"
}
```

---

### Get All Employees (manager scoped)

**POST** `/api/users/allemployees`

Description: Retrieve employees for a manager (request may be POST with optional body filters).

Example Success Response (200):

```json
{ "employees": [ { "employeeId": "2222...", "username": "john_employee", "email": "employee@company.com" } ] }
```

---

### Update Manager

**PATCH** `/api/users/update/manager`

Description: Update an employee's manager using their email and the managerId.

Request Body Example:

```json
{ "email": "yadav@gmail.com", "managerId": "11111111-1111-1111-1111-111111111111" }
```

Responses:
- 200 OK: "User updated successfully"
- 404 Not Found: "User not found"
- 403 Forbidden: insufficient role

---

### Delete User

**DELETE** `/api/users/{userId}`

Description: Delete a user by ID (admin-only or privileged role).

Responses:
- 200 OK: "User deleted successfully"
- 404 Not Found: "User not found"
- 403 Forbidden: insufficient role

---

### Gateway Health — All Services

**GET** `/health/services`

Description: Returns health status for gateway and discovered services (via Consul).

Example Success Response (200):

```json
{
  "gateway": "healthy",
  "services": [ { "name": "user-service", "url": "http://user-service:3000", "healthy": true } ]
}
```

---
