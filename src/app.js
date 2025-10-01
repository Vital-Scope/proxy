
import express from "express";
import cors from "cors";
import { startStreaming } from "./utills.js";

const PORT = +process.env.PORT;
const app = express();

app.use(cors())
app.use(express.json());

app.post("/proxy/random", (req, res) => {
  const monitoringId = req.body.monitoringId;
  console.log("monitoringId:", monitoringId);
  res.sendStatus(200);
  startStreaming(monitoringId);
});

app.get("/proxy/health-proxy", (req, res) => {
  res.status(200).json(true);
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access the random endpoint at: http://localhost:${PORT}/proxy/random`);
});
