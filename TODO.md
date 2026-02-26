# Project TO-DOs

## Models
- [X] Add `tel` field to User model and fix password re-hash bug
- [X] Implement Company model (name, address, website, description, tel)
- [X] Implement Interview model (date, user ref, company ref, booking limit, date validation)

## Auth Routes (`/api/v1/auth`)
- [X] Add telephone field to registration
- [X] Fix `succes` typo in login responses
- [X] Add try/catch to login and getMe
- [X] Implement logout endpoint (clear cookie)

## Company Routes (`/api/v1/companies`)
- [X] GET all companies
- [X] GET single company
- [X] POST create company (admin only)
- [X] PUT update company (admin only)
- [X] DELETE company (admin only)

## Interview Routes (`/api/v1/interviews`)
- [X] GET all interview bookings (admin only)
- [X] POST create booking (max 3 per user, date validation, user only)
- [X] GET single booking (user/admin)
- [X] PUT update booking (user/admin)
- [X] DELETE booking (user/admin)

## Business Logic
- [X] Enforce max 3 bookings per user
- [X] Validate interview date (May 10–13, 2022)
- [X] Ownership check for interview CRUD (user can only access own, admin can access any)

## Middleware / Infrastructure
- [X] Implement global error handler
- [X] Add security middleware (helmet, cors, mongoSanitize, xss, hpp, rateLimit)

## Testing & Documentation
- [X] Add Postman/Newman tests
- [ ] Add seeder script for initial data
- [X] Add API documentation (Swagger/OpenAPI or README summary)
- [ ] Add `.env` validation
