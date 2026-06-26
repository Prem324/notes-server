# API Documentation

## Auth Routes

### Login User

#### Method and URL

POST /api/v1/auth/login

#### Access

Public

#### Description

Logs in a registered user and returns a JWT token.

#### Headers

```http
Content-Type: application/json

Request Body
{
  "email": "prem@example.com",
  "password": "123456"
}
Success Response

Status: 200 OK

{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token"
  }
}
Error Responses

Status: 400 Bad Request

{
  "success": false,
  "message": "\"email\" must be a valid email"
}

Status: 401 Unauthorized

{
  "success": false,
  "message": "Invalid credentials"
}

---

# Example: Create Note Documentation

```md
### Create Note

#### Method and URL

POST /api/v1/notes

#### Access

Private

#### Description

Creates a new note for the authenticated user.

#### Headers

```http
Content-Type: application/json
Authorization: Bearer <token>
Request Body
{
  "title": "Learn Express",
  "content": "Practice REST API development",
  "completed": false
}
Success Response

Status: 201 Created

{
  "success": true,
  "message": "Note created successfully",
  "data": {
    "_id": "noteId",
    "title": "Learn Express",
    "content": "Practice REST API development",
    "completed": false,
    "user": "userId"
  }
}
Error Responses

Status: 400 Bad Request

{
  "success": false,
  "message": "\"title\" length must be at least 3 characters long"
}

Status: 401 Unauthorized

{
  "success": false,
  "message": "No token provided"
}