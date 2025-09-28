import mqtt from "mqtt";
import dotenv from "dotenv";

dotenv.config();

const mqttHost = process.env.MQTT_HOST || "localhost";
const mqttPort = process.env.MQTT_PORT || 1883;
const mqttTopic = process.env.MQTT_TOPIC || "sensor/data";

export const client = mqtt.connect({
  host: mqttHost,
  port: mqttPort,
  protocol: "mqtt",
  username: "user1",
  password: "user1"
});

client.on("connect", () => {
  console.log("MQTT client connected to broker");
});

client.on("error", e => {
  console.error("MQTT connection error:", e);
});

client.on("close", () => {
  console.log("MQTT client disconnected");
});

client.on("reconnect", () => {
  console.log("MQTT client reconnecting...");
});

export function sendToMqttTopic(data) {
  const msg = JSON.stringify(data);
  client.publishAsync(mqttTopic, msg).catch(err => console.error(err));
}
