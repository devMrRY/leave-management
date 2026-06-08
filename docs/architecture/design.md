# Leave Management System - Microservices Design Document

## 1. Overview

The Leave Management System is built using a microservices architecture to provide scalability, fault tolerance, maintainability, and independent deployment of services.

The system consists of multiple domain-driven services communicating through both synchronous REST APIs and asynchronous event-driven messaging.

## 2. Architecture Diagram

![Architecture Diagram](./leave-managment-architecture.png)

## 3. High-Level Architecture

### Components

#### API Gateway

Responsibilities:

* Entry point for all client requests
* JWT Authentication & Authorization
* Api rate limiting
* Request routing
* Service discovery integration
* Circuit breaker implementation
* User context propagation

#### User Service

Responsibilities:

* Employee management
* Manager hierarchy management
* User profile operations

#### Leave Service

Responsibilities:

* Leave application management
* Leave approval workflow
* Leave balance tracking

#### Notification Service

Responsibilities:

* Email notifications
* Event consumption from RabbitMQ
* Asynchronous communication

#### Consul

Responsibilities:

* Service registration
* Service discovery
* Health monitoring
* Automatic deregistration of unhealthy instances

#### RabbitMQ

Responsibilities:

* Event-driven communication
* Decoupled service interaction
* Reliable message delivery

#### MongoDB

Responsibilities:

* Persistent storage
* Service-specific databases

#### Jaeger

Responsibilities:

* Distributed tracing
* Request flow visualization

#### Pino

Responsibilities:

* Structured logging
* Centralized observability

---

## 4. Authentication Flow

1. Client sends JWT token.
2. API Gateway validates the token.
3. Gateway extracts:

   * User ID
   * User Role
4. Gateway forwards internal requests with:

   * `internal-api-key`
   * `x-user-id`
   * `x-user-role`
5. Internal services trust requests only when a valid internal API key is present.
6. JWT Verification is also present at service level act as secondary guard if some one bypasses gateway and tries to hit service directly with userId and role in headers

---

## 5. Service Discovery Flow

1. Service starts.
2. Service registers with Consul.
3. Keeps a memory discovery as well so don't have to hit consul every time and update the memory via periodic health check from consul.
4. Consul performs periodic health checks.
5. API Gateway discovers healthy instances dynamically.
6. Unhealthy instances are removed from load-balancing rotation. 
7. Critical services are automatically deregistered after the configured timeout.

---

## 6. Circuit Breaker Strategy

Circuit breakers are implemented at two levels:

### Gateway → Service

Protects the gateway from unavailable downstream services.

### Service → Service

Protects services from cascading failures during synchronous communication.

States:

* Closed
* Open
* Half-Open

Benefits:

* Prevents retry storms
* Improves resilience
* Reduces latency during outages

---

## 7. Event-Driven Communication

### User Service

1. User created then populate default leave balance in leave service leaveBalances collection.
    event published `user.created`
2. when manager updated then also updating the managerId in leaves collection
    even published `user.managerUpdated`

### Example: Leave Application Submitted

1. Leave Service creates leave request.
2. Leave Service publishes event:
   `leave.created`
   `leave.approved`
   `leave.rejected`
3. RabbitMQ receives event.
4. Notification Service consumes event.
5. Email notification is sent asynchronously.
6. Leave services consumes event published by user service such as `user.created` and `user.managerUpdated`

Benefits:

* Loose coupling
* Better scalability
* Independent deployments

---

## 8. Observability

### Distributed Tracing

Implemented using Jaeger.

Trace propagation:

* Gateway
* User Service
* Leave Service
* Notification Service

### Logging

Implemented using Pino.

Each log entry includes:

* Trace ID
* Span ID
* Log Level
* Timestamp

Trace ID will be propagated to http sync requests and async requests as well via rabbitmq

---

## 9. Resilience & Fault Tolerance

Features:

* Health checks
* Circuit breakers
* Service discovery
* Automatic failover
* Message durability
* Retry mechanisms
* Graceful degradation

---

## 10. Technology Stack

| Component         | Technology          |
| ----------------- | ------------------- |
| API Gateway       | Node.js, Express    |
| Services          | Node.js, TypeScript |
| Database          | MongoDB             |
| Messaging         | RabbitMQ            |
| Service Discovery | Consul              |
| Observability     | Jaeger, Pino        |
| Authentication    | JWT                 |
| Containerization  | Docker              |
| Reverse Proxy     | Nginx               |

---

## 11. Future Enhancements
* Maintaing DLQ
* Horizontal auto-scaling
* Distributed caching with Redis
