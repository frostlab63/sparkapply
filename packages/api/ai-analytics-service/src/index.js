const express = require("express");
const predictiveAnalyticsRoutes = require("./routes/predictiveAnalytics");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/analytics", predictiveAnalyticsRoutes);

app.listen(port, () => {
  console.log(`AI Analytics Service listening at http://localhost:${port}`);
});

