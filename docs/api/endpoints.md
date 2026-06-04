# API Endpoints

Base URL:

```text
http://localhost
```

All protected endpoints require:

```http
Authorization: Bearer <accessToken>
```

---

# Authentication APIs

## Register User

**POST** `/api/users/auth/register`

### Request Body

```json
{
  "email": "user@example.com",
  "password": "12345678",
  "username": "john123",
  "name": "John Doe",
  "managerId": "11111111-1111-1111-1111-111111111111"
}
```

---

## Login

**POST** `/api/users/auth/login`

### Request Body

```json
{
  "email": "manager@company.com",
  "password": "manager123"
}
```

---

## Refresh Token

**GET** `/api/users/auth/refresh-token`

**Authorization Required**

---

# User APIs

## Get User Details

**GET** `/api/users/{userId}`

### Example

```http
GET /api/users/11111111-1111-1111-1111-111111111111
```

**Authorization Required**

---

## Get All Employees

**GET** `/api/users/allemployees`

**Authorization Required**

---

## Update Employee Manager

**PATCH** `/api/users/update/manager`

### Request Body

```json
{
  "email": "employee@example.com",
  "managerId": "11111111-1111-1111-1111-111111111111"
}
```

**Authorization Required**

---

## Delete User

**DELETE** `/api/users/{userId}`

### Example

```http
DELETE /api/users/70d0067a-1b5b-4842-ba2b-b2e60cd1ac78
```

**Authorization Required**

---

# Leave APIs

## Apply Leave

**POST** `/api/leaves/apply`

### Request Body

```json
{
  "type": "CASUAL",
  "startDate": "2026-06-16",
  "endDate": "2026-06-16",
  "reason": "family function"
}
```

**Authorization Required**

---

## Get Leave Balance

**GET** `/api/leaves/balance`

**Authorization Required**

---

## Get Leave History

**GET** `/api/leaves/history`

### Query Parameters

| Parameter | Description  |
| --------- | ------------ |
| status    | Leave status |
| managerId | Manager ID   |
| startDate | Start date   |
| endDate   | End date     |
| type      | Leave type   |

### Example

```http
GET /api/leaves/history?status=PENDING&managerId=22222222-2222-2222-2222-222222222222&startDate=2026-06-15&endDate=2026-06-19&type=CASUAL
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
