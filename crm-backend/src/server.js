const app = require('./app');

const PORT = process.env.PORT || 3001; // Default to 3001 if not specified in .env

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
