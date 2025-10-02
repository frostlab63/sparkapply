const express = require("express");
const quantumMatchingRoutes = require("./routes/quantumMatching");

const app = express();
const port = process.env.PORT || 3003;

app.use(express.json());
app.use("/api/quantum", quantumMatchingRoutes);

app.listen(port, () => {
  console.log(`Quantum Matching Service listening at http://localhost:${port}`);
});

