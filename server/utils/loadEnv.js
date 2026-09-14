const path = require('path');
const dotenv = require('dotenv');

// Loads server/.env once. Variables already set in the environment win.
dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });
