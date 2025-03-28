# VillaFest API Documentation

## Base URL
`/api`

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the request header:
```http
Authorization: Bearer <your_token>
```

## Admin Endpoints

### 1. Register Admin
- **URL**: `/admin/register`
- **Method**: `POST`
- **Auth**: No
- **Body**:
```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "password123"
}
```
- **Response**: 
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "data": {
    "id": "admin_id",
    "name": "Admin Name",
    "email": "admin@example.com"
  },
  "token": "jwt_token"
}
```

### 2. Admin Login
- **URL**: `/admin/login`
- **Method**: `POST`
- **Auth**: No
- **Body**:
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```
- **Response**: Same as register

### 3. Get Admin Profile
- **URL**: `/admin/profile`
- **Method**: `GET`
- **Auth**: Yes
- **Response**:
```json
{
  "success": true,
  "message": "Admin profile fetched successfully",
  "data": {
    "id": "admin_id",
    "name": "Admin Name",
    "email": "admin@example.com"
  }
}
```

### 4. Admin Logout
- **URL**: `/admin/logout`
- **Method**: `GET`
- **Auth**: Yes

## Property Endpoints

### 1. Create Property
- **URL**: `/properties/add-property`
- **Method**: `POST`
- **Auth**: Yes (Admin)
- **Content-Type**: `multipart/form-data`
- **Body**:
```json
{
  "title": "Property Name",
  "category": "category_id",
  "price": 5000,
  "weekendPrice": 7000,
  "description": "Property description",
  "rules": ["No smoking", "No pets"],
  "amenities": ["amenity_id1", "amenity_id2"],
  "latitude": 12.345678,
  "longitude": 78.901234,
  "address": "Street address",
  "ownerName": "Owner Name",
  "ownerContact": "1234567890",
  "city": "City Name",
  "state": "State Name",
  "postalCode": "123456",
  "isActive": true,
  "maxGuests": 8,
  "mainImage": File, // Required
  "additionalImages": [File] // Optional, max 10 files
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Property created successfully",
  "property": {
    // Property details with populated category and amenities
  }
}
```

### 2. Get All Properties
- **URL**: `/properties/get-properties`
- **Method**: `GET`
- **Auth**: Yes (Admin)
- **Response**:
```json
{
  "success": true,
  "message": "Properties fetched successfully",
  "properties": [...],
  "total": 10
}
```

## Category Endpoints

### 1. Create Category
- **URL**: `/categories/create`
- **Method**: `POST`
- **Auth**: Yes (Admin)
- **Content-Type**: `multipart/form-data`
- **Body**:
```json
{
  "name": "Category Name",
  "isActive": true,
  "image": File
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Category created successfully",
  "category": {
    "name": "Category Name",
    "image": "/categories/category-name.jpg",
    "isActive": true
  }
}
```

### 2. Get Categories
- **URL**: `/categories`
- **Method**: `GET`
- **Auth**: No
- **Response**:
```json
{
  "success": true,
  "categories": [...]
}
```

## Amenity Endpoints

### 1. Create Amenity
- **URL**: `/amenities/create`
- **Method**: `POST`
- **Auth**: Yes (Admin)
- **Content-Type**: `multipart/form-data`
- **Body**:
```json
{
  "name": "Amenity Name",
  "isActive": true,
  "icon": File
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Amenity created successfully",
  "amenity": {
    "name": "Amenity Name",
    "icon": "/amenities/amenity-name.png",
    "iconUrl": "/amenities/amenity-name.png",
    "isActive": true
  }
}
```

### 2. Get Amenities
- **URL**: `/amenities`
- **Method**: `GET`
- **Auth**: Yes (Admin)
- **Response**:
```json
{
  "success": true,
  "amenities": [...]
}
```

### 3. Update Amenity
- **URL**: `/amenities/:id`
- **Method**: `PUT`
- **Auth**: Yes (Admin)
- **Content-Type**: `multipart/form-data`
- **Body**: Same as create
- **Response**: Same as create

## User Endpoints

### 1. Register User
- **URL**: `/users/register`
- **Method**: `POST`
- **Auth**: No
- **Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "mobileNumber": "1234567890",
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response**:
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
- **URL**: `/users/login`
- **Method**: `POST`
- **Auth**: No
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response**: Same as register

### 3. Get All Users
- **URL**: `/users/get-all-users`
- **Method**: `GET`
- **Auth**: Yes
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "mobileNumber": "1234567890"
    }
  ]
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Error message describing the issue"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details"
}
```
```

This documentation covers all endpoints found in the codebase, including:
- Complete request/response formats
- Authentication requirements
- File upload specifications
- Error handling
- All available endpoints for Properties, Categories, Amenities, Users, and Admin operations