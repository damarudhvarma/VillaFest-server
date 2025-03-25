# VillaFest API Documentation

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_token>
```

## Admin Endpoints

### 1. Register Admin

Register a new admin user.

- **URL**: `/admin/register`
- **Method**: `POST`
- **Auth required**: No

#### Request Body

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "password123"
}
```

#### Success Response

```json
{
  "success": true,
  "message": "Admin registered successfully",
  "data": {
    "id": "admin_id",
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "token": "jwt_token"
}
```

### 2. Admin Login

Authenticate an admin user.

- **URL**: `/admin/login`
- **Method**: `POST`
- **Auth required**: No

#### Request Body

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

#### Success Response

```json
{
  "success": true,
  "message": "Admin logged in successfully",
  "data": {
    "id": "admin_id",
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "token": "jwt_token"
}
```

## User Endpoints

### 1. Register User

Register a new user.

- **URL**: `/users/register`
- **Method**: `POST`
- **Auth required**: No

#### Request Body

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "mobileNumber": "1234567890",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Success Response

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "mobileNumber": "1234567890"
  },
  "token": "jwt_token"
}
```

### 2. User Login

Authenticate a user.

- **URL**: `/users/login`
- **Method**: `POST`
- **Auth required**: No

#### Request Body

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Success Response

```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "mobileNumber": "1234567890"
  },
  "token": "jwt_token"
}
```

### 3. Get User Profile

Get the authenticated user's profile.

- **URL**: `/users/profile`
- **Method**: `GET`
- **Auth required**: Yes

#### Success Response

```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "mobileNumber": "1234567890",
    "createdAt": "2024-03-25T...",
    "updatedAt": "2024-03-25T..."
  }
}
```

### 4. Update User Profile

Update the authenticated user's profile.

- **URL**: `/users/profile`
- **Method**: `PUT`
- **Auth required**: Yes

#### Request Body

```json
{
  "firstName": "Johnny",
  "lastName": "Doe",
  "mobileNumber": "9876543210"
}
```

#### Success Response

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user_id",
    "firstName": "Johnny",
    "lastName": "Doe",
    "email": "john@example.com",
    "mobileNumber": "9876543210"
  }
}
```

## Error Responses

### Validation Error

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": ["Email is required", "Password must be at least 6 characters long"]
}
```

### Authentication Error

```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### Not Found Error

```json
{
  "success": false,
  "message": "Not Found",
  "error": "Cannot GET /invalid/path"
}
```

### Server Error

```json
{
  "success": false,
  "message": "Internal Server Error",
  "error": "Error details..."
}
```

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/villafest
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```
