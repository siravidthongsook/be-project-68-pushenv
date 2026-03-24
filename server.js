const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser')
const connectDB = require('./config/db');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

// // Route files
const companies = require('./routes/companies');
const auth = require('./routes/auth');
const interviews = require('./routes/interviews');
const users = require('./routes/users');

// Error Handler Middleware
const errorHandler = require('./middleware/error');

const app = express();

app.set('query parser','extended')

// Body parser
app.use(express.json());
app.use(cookieParser());

// --- SECURITY MIDDLEWARE INITIALIZATION ---

app.use((req, res, next) => {
  Object.defineProperty(req, 'query', {
    value: req.query,
    writable: true,
    configurable: true,
    enumerable: true
  });
  next();
});

// Sanitize data (Prevents NoSQL injection)
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS (Cross-Site Scripting) attacks
app.use(xss());

// Enable CORS (Allows different domains to access your API)
app.use(cors());
app.options(/.*/, cors());

// Rate limiting (Prevents brute-force attacks/spamming)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10000, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Prevent HTTP param pollution
app.use(hpp());

app.use('/api/v1/companies', companies);
app.use('/api/v1/auth', auth);
app.use('/api/v1/interviews', interviews);
app.use('/api/v1/users', users);

const PORT = process.env.PORT || 5000;

app.use(errorHandler);

const server = app.listen(
    PORT, 
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
