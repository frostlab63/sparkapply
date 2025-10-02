const express = require("express");
const interviewPreparationRoutes = require("./routes/interviewPreparation");

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());
app.use("/api/interview", interviewPreparationRoutes);

app.listen(port, () => {
  console.log(`Interview Preparation Service listening at http://localhost:${port}`);
});

