import mqtt from "mqtt";
import dotenv from "dotenv";

dotenv.config();

const mqttHost = process.env.MQTT_HOST || "localhost";
const mqttPort = process.env.MQTT_PORT || 1883;
const mqttTopic = process.env.MQTT_TOPIC;

let client;

export function initializeMqttClient() {
  if (client) return client;

  client = mqtt.connect({
    host: mqttHost,
    port: mqttPort,
    protocol: "mqtt",
    username: "user1",
    password: "user1",
  });

  setupEventHandlers();
  return client;
}

function setupEventHandlers() {
  client.on("connect", () => {
    console.log("MQTT client connected to broker");
  });

  client.on("error", (error) => {
    console.error("MQTT connection error:", error);
  });

  client.on("close", () => {
    console.log("MQTT client disconnected");
  });

  client.on("reconnect", () => {
    console.log("MQTT client reconnecting...");
  });
}

export function sendDataToMqtt(data) {
  if (!client) {
    initializeMqttClient();
  }

  const message = JSON.stringify(data);
  console.log(message);
  
  client.publish(
    mqttTopic,
    message,
    {
      qos: 1,
      retain: true,
    },
    (error) => {
      if (error) console.log(error);
    }
  );
}
