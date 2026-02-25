const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser')
const connectDB = require('./config/db');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

// // Route files
const companies = require('./routes/companies');
const auth = require('./routes/auth');
const interviews = require('./routes/interviews');

const app = express();

app.set('query parser','extended')

// Body parser
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/companies', companies);
app.use('/api/v1/auth', auth);
app.use('/api/v1/interviews', interviews);

const PORT = process.env.PORT || 5000;

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