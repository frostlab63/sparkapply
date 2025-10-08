const express = require("express");
const cors = require("cors");
const { sequelize } = require("./config/database");
const applicationRoutes = require("./routes/enhancedApplicationRoutes");
const interviewRoutes = require("./routes/enhancedInterviewRoutes");
const documentRoutes = require("./routes/test_routes");
require("./models");

const app = express();

app.use(cors());
app.use(express.json());

// Dummy auth middleware
app.use((req, res, next) => {
  req.user = { id: 1 };
  next();
});

// Health endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "application-service",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/documents", documentRoutes);

const PORT = process.env.PORT || 3005;

sequelize.sync({ force: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

module.exports = app;

