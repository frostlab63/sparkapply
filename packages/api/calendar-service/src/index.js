const express = require('express');
const calendarRoutes = require('./routes/calendar');

const app = express();
const PORT = process.env.PORT || 3012;

app.use(express.json());

app.use('/api/calendar', calendarRoutes);

app.listen(PORT, () => {
  console.log(`Calendar service listening on port ${PORT}`);
});
