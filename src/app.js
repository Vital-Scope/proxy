import express from "express";
import cors from "cors";
import { startStreaming, stopStreaming } from "./services/streamingService.js";
import { initializeMqttClient } from "./utils/mqttUtils.js";

const PORT = +process.env.PORT;
const app = express();

app.use(cors());
app.use(express.json());

initializeMqttClient();

const handleStartStream = (req, res) => {
  const monitoringId = req.body.monitoringId;
  console.log("monitoringId:", monitoringId);
  res.sendStatus(200);
  startStreaming(monitoringId);
};

const handleStopStream = (req, res) => {
  const monitoringId = req.body.monitoringId;
  console.log("Stopping stream for monitoringId:", monitoringId);
  
  stopStreaming(monitoringId);
  res.status(200).json({ success: true, message: "Stream stopped" });
};

const handleHealthCheck = (req, res) => {
  res.status(200).json(true);
};

const handleNotFound = (req, res) => {
  res.status(404).json({ success: false, error: "Not found" });
};

app.post("/proxy/random", handleStartStream);
app.post("/proxy/stop", handleStopStream);
app.get("/proxy/health-proxy", handleHealthCheck);
app.use(handleNotFound);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access the random endpoint at: http://localhost:${PORT}/proxy/random`);
  console.log(`Access the stop endpoint at: http://localhost:${PORT}/proxy/stop`);
});