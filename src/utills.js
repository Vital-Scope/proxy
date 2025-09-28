import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import * as readline from "node:readline";
import { createReadStream } from "fs";
import { sendToMqttTopic } from "./mqtt.js";

dotenv.config();

const hypoxiaDir = path.join(process.cwd(), "dataset/hypoxia");
const regularDir = path.join(process.cwd(), "dataset/regular");
const datasetList = [hypoxiaDir, regularDir];

export async function getRandomFile(type) {
  const datasetTypePath = datasetList[type];
  const dirs = await getDirContent(datasetTypePath);
  const randomDir = dirs[Math.floor(Math.random() * dirs.length)];

  const bpmDir = await getDirContent(
    path.join(datasetTypePath, randomDir, "bpm")
  );
  const uterusDir = await getDirContent(
    path.join(datasetTypePath, randomDir, "uterus")
  );
  const randomIndex = Math.floor(Math.random() * bpmDir.length);

  return [
    path.join(datasetTypePath, randomDir, "bpm", bpmDir[randomIndex]),
    path.join(datasetTypePath, randomDir, "uterus", uterusDir[randomIndex]),
  ];
}

export async function getDirContent(url) {
  const files = await fs.readdir(url);
  return files;
}

export async function startStreaming() {
  try {
    const files = await getRandomFile(0);

    files.forEach(async (path, idx) => {
      const stream = createReadStream(path);
      const rl = readline.createInterface({
        input: stream,
      });

      for await (const line of rl) {
        const [time, value] = line.split(",");
        sendToMqttTopic({
          Type: idx,
          Time: time,
          Value: value,
        });
      }
      rl.close();
    });
  } catch (error) {
    console.error(error);
  }
}
