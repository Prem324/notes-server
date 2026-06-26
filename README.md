![Run Backend Tests](https://github.com/Prem324/notes-api/actions/workflows/test.yml/badge.svg)

# Notes API

A production-ready REST API built with Node.js, Express.js, MongoDB, and JWT authentication.

This project includes authentication, authorization, notes CRUD, comments, file uploads, profile picture management, analytics, validation, centralized error handling, security hardening, testing, pagination, health checks, and graceful shutdown.

---

## Features

* User registration and login
* JWT authentication
* Role-based authorization
* Notes CRUD
* Comments on notes
* Profile picture upload and delete
* Note attachment upload and delete
* Cloudinary file storage
* Image compression using Sharp
* Request validation using Joi
* Centralized error handling
* Custom `AppError` class
* Consistent API responses
* Better HTTP status codes
* Rate limiting for login and registration
* Security headers using Helmet
* Restricted CORS configuration
* Request body size limits
* Secure authorization header validation
* Custom request sanitizer
* MongoDB indexes
* Pagination metadata
* Analytics endpoints
* Health check route
* Graceful shutdown
* Unit, middleware, route, service, and integration tests

---

## Tech Stack

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcryptjs
* Joi
* Multer
* Sharp
* Cloudinary
* Helmet
* CORS
* Morgan
* Jest
* Supertest
* MongoDB Memory Server

---

## Project Structure

```text
notes-api/
│
├── config/
│   ├── db.js
│   ├── env.js
│   └── cloudinary.js
│
├── controllers/
│   ├── authController.js
│   ├── noteController.js
│   ├── commentController.js
│   ├── userController.js
│   ├── analyticsController.js
│   └── healthController.js
│
├── middleware/
│   ├── auth.js
│   ├── authorize.js
│   ├── asyncHandler.js
│   ├── errorHandler.js
│   ├── validate.js
│   ├── upload.js
│   ├── rateLimiter.js
│   ├── sanitizeRequest.js
│   └── requestLogger.js
│
├── models/
│   ├── User.js
│   ├── Note.js
│   └── Comment.js
│
├── routes/
│   ├── authRoutes.js
│   ├── noteRoutes.js
│   ├── commentRoutes.js
│   ├── userRoutes.js
│   ├── analyticsRoutes.js
│   └── healthRoutes.js
│
├── services/
│   ├── authService.js
│   ├── noteService.js
│   ├── commentService.js
│   ├── userService.js
│   ├── analyticsService.js
│   ├── uploadService.js
│   └── mediaService.js
│
├── tests/
│   ├── auth.integration.test.js
│   ├── note.integration.test.js
│   ├── authService.test.js
│   ├── noteService.test.js
│   ├── commentService.test.js
│   ├── authMiddleware.test.js
│   ├── errorHandler.test.js
│   └── ...
│
├── utils/
│   ├── AppError.js
│   └── apiResponse.js
│
├── validators/
│   ├── authValidator.js
│   └── noteValidator.js
│
├── app.js
├── server.js
├── package.json
├── .env.example
└── README.md
```

---

## Installation

Clone the repository and install dependencies.

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the project root.

Use `.env.example` as a reference.

```env
NODE_ENV=development
PORT=5000

MONGO_URI=your-mongodb-uri

JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=1d

CLIENT_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

---

## Important Security Note

Do not commit your real `.env` file.

Only commit `.env.example`.

```text
.env              -> private, should not be committed
.env.example      -> public, safe to commit
```

---

## Run Development Server

```bash
npm run dev
```

Development server uses Nodemon.

---

## Run Production Server

```bash
node server.js
```

---

## Run Tests

Run all tests:

```bash
npm test
```

Run a specific test file:

```bash
npx jest tests/auth.integration.test.js --verbose
```

---

## Health Check

### Request

```http
GET /health
```

### Response

```json
{
  "success": true,
  "message": "Server is healthy",
  "uptime": 123.45,
  "timestamp": "2026-06-13T08:00:00.000Z",
  "environment": "development"
}
```

---

## API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message"
}
```

---

## Authentication

Protected routes require a JWT token in the Authorization header.

```http
Authorization: Bearer <token>
```

Invalid or missing tokens return:

```json
{
  "success": false,
  "message": "No token provided"
}
```

or:

```json
{
  "success": false,
  "message": "Invalid token"
}
```

---

## API Routes

---

# Auth Routes

Base URL:

```text
/api/v1/auth
```

| Method | Endpoint    | Access  | Description               |
| ------ | ----------- | ------- | ------------------------- |
| POST   | `/register` | Public  | Register a new user       |
| POST   | `/login`    | Public  | Login user                |
| GET    | `/profile`  | Private | Get decoded token profile |

---

## Register User

```http
POST /api/v1/auth/register
```

### Body

```json
{
  "name": "Prem",
  "email": "prem@example.com",
  "password": "123456"
}
```

### Success Response

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "userId",
    "name": "Prem",
    "email": "prem@example.com"
  }
}
```

---

## Login User

```http
POST /api/v1/auth/login
```

### Body

```json
{
  "email": "prem@example.com",
  "password": "123456"
}
```

### Success Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token"
  }
}
```

---

# Notes Routes

Base URL:

```text
/api/v1/notes
```

| Method | Endpoint                             | Access  | Description             |
| ------ | ------------------------------------ | ------- | ----------------------- |
| GET    | `/`                                  | Private | Get notes               |
| POST   | `/`                                  | Private | Create note             |
| PUT    | `/:id`                               | Private | Update note             |
| DELETE | `/:id`                               | Private | Delete note             |
| GET    | `/:id/comments`                      | Private | Get note with comments  |
| POST   | `/:id/attachments`                    | Private | Upload note attachments |
| DELETE | `/:noteId/attachments/:attachmentId` | Private | Delete note attachment  |

---

## Get Notes

```http
GET /api/v1/notes
```

### Query Parameters

| Parameter | Description             | Default |
| --------- | ----------------------- | ------- |
| `page`    | Page number             | `1`     |
| `limit`   | Notes per page          | `10`    |
| `search`  | Search by title/content | Empty   |

### Example

```http
GET /api/v1/notes?page=1&limit=10&search=backend
```

### Success Response

```json
{
  "success": true,
  "message": "Notes fetched successfully",
  "data": {
    "notes": [
      {
        "_id": "noteId",
        "title": "Learn Backend",
        "content": "Express and MongoDB",
        "completed": false
      }
    ],
    "pagination": {
      "totalNotes": 1,
      "currentPage": 1,
      "totalPages": 1,
      "limit": 10,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

## Create Note

```http
POST /api/v1/notes
```

### Body

```json
{
  "title": "Learn Express",
  "content": "Practice REST API development",
  "completed": false
}
```

### Success Response

```json
{
  "success": true,
  "message": "Note created successfully",
  "data": {
    "_id": "noteId",
    "title": "Learn Express",
    "content": "Practice REST API development",
    "completed": false
  }
}
```

---

## Update Note

```http
PUT /api/v1/notes/:id
```

### Body

```json
{
  "title": "Updated Note",
  "content": "Updated content",
  "completed": true
}
```

### Success Response

```json
{
  "success": true,
  "message": "Note updated successfully",
  "data": {
    "_id": "noteId",
    "title": "Updated Note",
    "content": "Updated content",
    "completed": true
  }
}
```

---

## Delete Note

```http
DELETE /api/v1/notes/:id
```

### Success Response

```json
{
  "success": true,
  "message": "Note deleted successfully"
}
```

---

## Upload Note Attachments

```http
POST /api/v1/notes/:id/attachments
```

### Form Data

| Field         | Type   | Description          |
| ------------- | ------ | -------------------- |
| `attachments` | File[] | Upload up to 5 files |

Allowed file types:

```text
JPG
PNG
WEBP
PDF
```

Maximum file size:

```text
5MB per file
```

### Success Response

```json
{
  "success": true,
  "message": "Attachment uploaded successfully",
  "data": {
    "_id": "noteId",
    "attachments": [
      {
        "url": "cloudinary-url",
        "publicId": "cloudinary-public-id",
        "fileName": "image.png",
        "fileType": "image/png",
        "size": 12345
      }
    ]
  }
}
```

---

## Delete Attachment

```http
DELETE /api/v1/notes/:noteId/attachments/:attachmentId
```

### Success Response

```json
{
  "success": true,
  "message": "Attachment deleted successfully",
  "data": {
    "_id": "noteId",
    "attachments": []
  }
}
```

---

# Comment Routes

Base URL:

```text
/api/v1/comments
```

| Method | Endpoint        | Access  | Description             |
| ------ | --------------- | ------- | ----------------------- |
| POST   | `/:noteId`      | Private | Create comment          |
| GET    | `/note/:noteId` | Private | Get comments for a note |

---

## Create Comment

```http
POST /api/v1/comments/:noteId
```

### Body

```json
{
  "text": "This is a comment"
}
```

### Success Response

```json
{
  "success": true,
  "message": "Comment created successfully",
  "data": {
    "_id": "commentId",
    "text": "This is a comment",
    "note": "noteId",
    "user": "userId"
  }
}
```

---

## Get Comments By Note

```http
GET /api/v1/comments/note/:noteId
```

### Success Response

```json
{
  "success": true,
  "message": "Comments fetched successfully",
  "data": [
    {
      "_id": "commentId",
      "text": "This is a comment",
      "user": {
        "name": "Prem",
        "email": "prem@example.com"
      }
    }
  ]
}
```

---

# User Routes

Base URL:

```text
/api/v1/users
```

| Method | Endpoint           | Access  | Description            |
| ------ | ------------------ | ------- | ---------------------- |
| GET    | `/profile`         | Private | Get user profile       |
| POST   | `/profile-picture` | Private | Upload profile picture |
| DELETE | `/profile-picture` | Private | Delete profile picture |

---

## Get User Profile

```http
GET /api/v1/users/profile
```

### Success Response

```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "_id": "userId",
    "name": "Prem",
    "email": "prem@example.com",
    "profilePicture": {
      "url": "cloudinary-url",
      "publicId": "cloudinary-public-id"
    }
  }
}
```

---

## Upload Profile Picture

```http
POST /api/v1/users/profile-picture
```

### Form Data

| Field            | Type |
| ---------------- | ---- |
| `profilePicture` | File |

### Success Response

```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "_id": "userId",
    "profilePicture": {
      "url": "cloudinary-url",
      "publicId": "cloudinary-public-id"
    }
  }
}
```

---

## Delete Profile Picture

```http
DELETE /api/v1/users/profile-picture
```

### Success Response

```json
{
  "success": true,
  "message": "Profile picture deleted successfully",
  "data": {
    "_id": "userId",
    "profilePicture": null
  }
}
```

---

# Analytics Routes

Base URL:

```text
/api/v1/analytics
```

These routes are intended for admin users.

| Method | Endpoint             | Access | Description                  |
| ------ | -------------------- | ------ | ---------------------------- |
| GET    | `/notes-per-user`    | Admin  | Get total notes per user     |
| GET    | `/comments-per-note` | Admin  | Get total comments per note  |
| GET    | `/most-active-user`  | Admin  | Get most active user         |
| GET    | `/monthly-notes`     | Admin  | Get notes created this month |

---

## Notes Per User

```http
GET /api/v1/analytics/notes-per-user
```

### Success Response

```json
{
  "success": true,
  "message": "Notes per user fetched successfully",
  "data": [
    {
      "userId": "userId",
      "name": "Prem",
      "email": "prem@example.com",
      "totalNotes": 10
    }
  ]
}
```

---

## Comments Per Note

```http
GET /api/v1/analytics/comments-per-note
```

### Success Response

```json
{
  "success": true,
  "message": "Comments per note fetched successfully",
  "data": [
    {
      "noteId": "noteId",
      "title": "Learn Express",
      "totalComments": 5
    }
  ]
}
```

---

## Most Active User

```http
GET /api/v1/analytics/most-active-user
```

### Success Response

```json
{
  "success": true,
  "message": "Most active user fetched successfully",
  "data": [
    {
      "userId": "userId",
      "name": "Prem",
      "email": "prem@example.com",
      "totalNotes": 10
    }
  ]
}
```

---

## Monthly Notes

```http
GET /api/v1/analytics/monthly-notes
```

### Success Response

```json
{
  "success": true,
  "message": "Monthly notes fetched successfully",
  "data": {
    "totalNotes": 5
  }
}
```

---

# HTTP Status Codes

| Status Code | Meaning                                       |
| ----------- | --------------------------------------------- |
| `200`       | Success                                       |
| `201`       | Resource created                              |
| `400`       | Bad request / validation error / invalid file |
| `401`       | Unauthenticated                               |
| `403`       | Forbidden / not authorized                    |
| `404`       | Resource not found                            |
| `409`       | Conflict / duplicate email                    |
| `429`       | Too many requests                             |
| `500`       | Internal server error                         |

---

# Error Examples

## Validation Error

```json
{
  "success": false,
  "message": "\"email\" must be a valid email"
}
```

## Invalid Credentials

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

## Unauthorized

```json
{
  "success": false,
  "message": "No token provided"
}
```

## Forbidden

```json
{
  "success": false,
  "message": "Not authorized"
}
```

## Not Found

```json
{
  "success": false,
  "message": "Note not found"
}
```

## Duplicate Email

```json
{
  "success": false,
  "message": "Email already exists"
}
```

---

# Production Readiness Features

## Centralized Error Handling

The project uses a custom `AppError` class for operational errors.

```javascript
throw new AppError("Note not found", 404);
```

All errors are handled by centralized error middleware.

---

## Consistent API Responses

Success responses follow this structure:

```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

Error responses follow this structure:

```json
{
  "success": false,
  "message": "Error message"
}
```

---

## Authentication Standard

Protected routes require a JWT token.

The token must be sent in the `Authorization` header using the Bearer format.

```http
Authorization: Bearer <token>
```

## Security Features

* Helmet security headers
* Disabled `x-powered-by`
* Restricted CORS
* Request body size limit
* URL encoded body size limit
* Strong Authorization header validation
* Rate limiting
* Joi validation
* Upload file type validation
* Upload file size limit
* Hidden unexpected 500 error details in production

---

## Database Performance

The Note model includes indexes for search and sorting.

```javascript
noteSchema.index({
  title: "text",
  content: "text",
});

noteSchema.index({
  user: 1,
  createdAt: -1,
});
```

---

## Graceful Shutdown

The server handles:

```text
SIGINT
SIGTERM
```

This allows the app to close the HTTP server and MongoDB connection cleanly.

---

## Testing

This project includes:

* Service unit tests
* Middleware tests
* Route tests
* Integration tests
* Auth integration tests
* Notes integration tests
* Upload middleware tests
* Error handler tests
* Security header tests
* Health route tests

Run tests:

```bash
npm test
```

---

# Common Commands

```bash
npm install
npm run dev
node server.js
npm test
```

---

# Production Checklist

Before deploying:

* [ ] `.env` configured
* [ ] `NODE_ENV=production`
* [ ] `MONGO_URI` configured
* [ ] Strong `JWT_SECRET` configured
* [ ] `CLIENT_URL` set to production frontend URL
* [ ] Cloudinary credentials configured
* [ ] `.env` ignored by Git
* [ ] Health route tested
* [ ] Tests passing
* [ ] CORS configured
* [ ] Rate limiting enabled
* [ ] Logs checked
* [ ] Graceful shutdown tested
* [ ] MongoDB indexes created

---

## Deployment

This Notes API backend is deployed as a production web service.

The deployed API can be used for testing authentication, notes CRUD, comments, file uploads, profile management, analytics, Swagger documentation, and health checks.

---

## Production API URL

```text
https://your-render-url.onrender.com
```

Replace the URL above with your actual deployed backend URL.

Example:

```text
https://notes-api-abc1.onrender.com
```

---

## Deployment Platform

This backend is deployed using Render.

Deployment flow:

```text
Local project
↓
Git commit
↓
Push to GitHub
↓
Render pulls latest code
↓
Render installs dependencies
↓
Render runs npm start
↓
API becomes available online
```

---

## GitHub Repository

The project source code is pushed to GitHub.

Render is connected to the GitHub repository, so future commits pushed to the main branch can trigger redeployment.

---

## Render Web Service Configuration

Recommended Render settings:

| Setting       | Value         |
| ------------- | ------------- |
| Service Type  | Web Service   |
| Runtime       | Node          |
| Branch        | main          |
| Build Command | `npm install` |
| Start Command | `npm start`   |

The project uses the following production start script:

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

---

## Production Environment Variables

The deployed server does not use the local `.env` file.

Production environment variables are configured inside the Render dashboard.

Required variables:

```env
NODE_ENV=production
PORT=5000

MONGO_URI=your-mongodb-atlas-uri

JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=1d

CLIENT_URL=your-frontend-url
SERVER_URL=your-render-backend-url

CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

Example:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/notes-api
JWT_SECRET=strong-production-secret
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:3000
SERVER_URL=https://your-render-url.onrender.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## Important Security Notes

Do not commit the real `.env` file to GitHub.

The `.env` file may contain sensitive values such as:

```text
MongoDB Atlas URI
JWT secret
Cloudinary API secret
```

Only commit `.env.example`.

Recommended `.gitignore` entries:

```text
node_modules
.env
coverage
```

---

## Database Deployment

The production database is hosted on MongoDB Atlas.

The deployed backend connects to MongoDB Atlas using:

```env
MONGO_URI=your-mongodb-atlas-uri
```

MongoDB Atlas requirements:

* Cluster created
* Database user created
* Password configured
* Network access configured
* Connection string added to Render environment variables

For beginner deployment, Atlas network access may use:

```text
0.0.0.0/0
```

This allows the deployed server to connect from Render.

---

## Cloudinary Deployment

Cloudinary is used for:

* Note attachments
* Profile picture uploads
* Image storage
* Image delivery URLs

Required Cloudinary variables:

```env
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

These values must be added to Render environment variables.

---

## Health Check

The API includes a health check route.

### Request

```http
GET /health
```

### Production Example

```http
GET https://your-render-url.onrender.com/health
```

### Response

```json
{
  "success": true,
  "message": "Server is healthy",
  "uptime": 123.45,
  "timestamp": "2026-06-13T08:00:00.000Z",
  "environment": "production"
}
```

The health route is useful for:

* Checking whether the server is live
* Deployment verification
* Monitoring tools
* Render service checks

---

## Swagger API Documentation

Swagger UI is available in production.

### Production Swagger URL

```http
GET https://your-render-url.onrender.com/api-docs
```

Swagger provides interactive documentation for:

* Auth routes
* Notes routes
* Comment routes
* User profile routes
* File upload routes
* Analytics routes
* Health route

---

## Postman Production Environment

Create a separate Postman environment for production.

Environment name:

```text
Notes API Production
```

Recommended variables:

| Variable       | Value                                  |
| -------------- | -------------------------------------- |
| `baseUrl`      | `https://your-render-url.onrender.com` |
| `token`        | Empty initially                        |
| `noteId`       | Empty initially                        |
| `attachmentId` | Empty initially                        |
| `commentId`    | Empty initially                        |

Use production requests like:

```http
POST {{baseUrl}}/api/v1/auth/login
GET {{baseUrl}}/api/v1/notes
POST {{baseUrl}}/api/v1/notes/{{noteId}}/attachments
```

Protected routes require:

```http
Authorization: Bearer {{token}}
```

---

## Production Routes To Verify

After deployment, these routes should be tested.

### Health

```http
GET /health
```

### Swagger

```http
GET /api-docs
```

### Auth

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
GET /api/v1/auth/profile
```

### Notes

```http
GET /api/v1/notes
POST /api/v1/notes
PUT /api/v1/notes/:id
DELETE /api/v1/notes/:id
POST /api/v1/notes/:id/attachments
DELETE /api/v1/notes/:noteId/attachments/:attachmentId
```

### Comments

```http
POST /api/v1/comments/:noteId
GET /api/v1/comments/note/:noteId
```

### Users

```http
GET /api/v1/users/profile
PATCH /api/v1/users/profile-picture
DELETE /api/v1/users/profile-picture
```

### Analytics

```http
GET /api/v1/analytics/notes-per-user
GET /api/v1/analytics/comments-per-note
GET /api/v1/analytics/most-active-user
GET /api/v1/analytics/monthly-notes
```

---

## Deployment Checklist

Before deployment:

* [x] Code pushed to GitHub
* [x] `.env` is ignored by Git
* [x] `.env.example` is available
* [x] `npm test` passes locally
* [x] `node server.js` works locally
* [x] MongoDB Atlas URI is ready
* [x] Cloudinary credentials are ready
* [x] Strong production JWT secret is ready
* [x] `start` script is configured
* [x] `app.js` exports the Express app
* [x] `server.js` starts the server

After deployment:

* [x] Render service created
* [x] Environment variables added to Render
* [x] MongoDB Atlas connected
* [x] Cloudinary upload tested
* [x] Health route tested
* [x] Swagger docs tested
* [x] Auth routes tested
* [x] Notes routes tested
* [x] Attachment upload tested
* [x] Profile picture upload tested
* [x] Comment routes tested
* [x] Analytics routes tested
* [x] Postman production environment created

---

## Common Deployment Issues

### Missing Environment Variable

If deployment fails with an error like:

```text
Missing required environment variable
```

Check Render environment variables and make sure all required keys are added.

---

### MongoDB Connection Failed

If MongoDB connection fails:

* Check `MONGO_URI`
* Check username and password
* Check database user permissions
* Check MongoDB Atlas Network Access
* Make sure Atlas allows access from Render

---

### Cloudinary Upload Failed

If file upload fails:

* Check `CLOUDINARY_CLOUD_NAME`
* Check `CLOUDINARY_API_KEY`
* Check `CLOUDINARY_API_SECRET`
* Make sure the variable names match `config/env.js`

---

### CORS Error

If frontend requests are blocked:

* Check `CLIENT_URL`
* Make sure it matches the frontend URL exactly
* Include `https://` in production frontend URL
* Redeploy after changing environment variables

---

### Swagger Shows Localhost

If Swagger still shows:

```text
http://localhost:5000
```

Add this environment variable in Render:

```env
SERVER_URL=https://your-render-url.onrender.com
```

Then make sure `config/swagger.js` uses:

```javascript
servers: [
  {
    url: config.serverUrl,
    description: "Current server"
  }
]
```

---

## Production Start Command

Render starts the backend using:

```bash
npm start
```

The `package.json` script should be:

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

---

## Deployment Status

The backend API has been successfully deployed and tested in production.

Verified production features:

* Health check route
* Swagger API documentation
* JWT authentication
* Notes CRUD
* File uploads
* Profile picture upload
* Comments
* Analytics
* MongoDB Atlas connection
* Cloudinary integration
* Production environment variables


# License

This project is for learning and portfolio purposes.
