# Project TO-DOs

## Models
- [X] Add `tel` field to User model and fix password re-hash bug
- [ ] Implement Company model (name, address, website, description, tel)
- [ ] Implement Interview model (date, user ref, company ref, booking limit, date validation)

## Auth Routes (`/api/v1/auth`)
- [ ] Add telephone field to registration
- [X] Fix `succes` typo in login responses
- [ ] Add try/catch to login and getMe
- [ ] Implement logout endpoint (clear cookie)

## Company Routes (`/api/v1/companies`)
- [ ] GET all companies
- [ ] GET single company
- [ ] POST create company (admin only)
- [ ] PUT update company (admin only)
- [ ] DELETE company (admin only)

## Interview Routes (`/api/v1/interviews`)
- [ ] GET all interview bookings (admin only)
- [ ] POST create booking (max 3 per user, date validation, user only)
- [ ] GET single booking (user/admin)
- [ ] PUT update booking (user/admin)
- [ ] DELETE booking (user/admin)

## Business Logic
- [ ] Enforce max 3 bookings per user
- [ ] Validate interview date (May 10–13, 2022)
- [ ] Ownership check for interview CRUD (user can only access own, admin can access any)

## Middleware / Infrastructure
- [ ] Implement global error handler
- [ ] Add security middleware (helmet, cors, mongoSanitize, xss, hpp, rateLimit)

## Testing & Documentation
- [ ] Add Postman/Newman tests
- [ ] Add seeder script for initial data
- [ ] Add API documentation (Swagger/OpenAPI or README summary)
- [ ] Add `.env` validation
