const express = require('express');
const mongoose = require('mongoose');
const gamificationRoutes = require('./routes/gamification');

const app = express();
const PORT = process.env.PORT || 3010;

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/gamification-service', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use('/api/gamification', gamificationRoutes);

app.listen(PORT, () => {
  console.log(`Gamification service listening on port ${PORT}`);
});

