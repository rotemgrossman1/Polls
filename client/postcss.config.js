const path = require('path');

module.exports = {
  plugins: {
    // Explicit path so the Tailwind config is found from any working directory.
    tailwindcss: { config: path.join(__dirname, 'tailwind.config.js') },
    autoprefixer: {},
  },
};
