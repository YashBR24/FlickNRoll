const app = require('./app');
const connectDB = require('./src/config/db');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;

const cors = require('cors');
// app.use(cors({ origin: 'http://localhost:5000', credentials: true }));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});