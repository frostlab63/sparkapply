const express = require("express");
const voiceSearchRoutes = require("./routes/voiceSearch");

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use("/api/voice", voiceSearchRoutes);

app.listen(port, () => {
  console.log(`Voice Processing Service listening at http://localhost:${port}`);
});

