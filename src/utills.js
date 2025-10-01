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

const activeStreams = new Map();

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

export async function startStreaming(id) {
  if (activeStreams.has(id)) {
    stopStreaming(id);
  }

  const streams = [];
  const timeouts = [];
  let isStopped = false;

  activeStreams.set(id, {
    stop: () => {
      isStopped = true;
      timeouts.forEach(clearTimeout);
      streams.forEach(stream => {
        if (stream && typeof stream.close === 'function') {
          stream.close();
        }
      });
      activeStreams.delete(id);
      console.log(`Stream ${id} stopped`);
    }
  });

  try {
    const files = await getRandomFile(0);
    const uniqueKey = id;
    const baseDir = path.join(process.cwd(), process.env.DIR_PATH, uniqueKey);
    const bpmDir = path.join(baseDir, "bpm");
    const uterusDir = path.join(baseDir, "uterus");

    await fs.mkdir(baseDir, { recursive: true });
    await fs.mkdir(bpmDir, { recursive: true });
    await fs.mkdir(uterusDir, { recursive: true });

    // Копируем files[0] в bpm, files[1] в uterus с оригинальными именами
    const bpmFileName = path.basename(files[0]);
    const uterusFileName = path.basename(files[1]);
    await fs.copyFile(files[0], path.join(bpmDir, bpmFileName));
    await fs.copyFile(files[1], path.join(uterusDir, uterusFileName));

    for (let idx = 0; idx < files.length; idx++) {
      if (isStopped) break;
      
      const filePath = files[idx];
      const stream = createReadStream(filePath);
      streams.push(stream);
      
      const rl = readline.createInterface({
        input: stream,
      });
      
      let linesRead = 0;
      let prev = 0;
      
      for await (const line of rl) {
        if (isStopped) break;
        
        if (linesRead === 0) {
          linesRead++;
          continue;
        }
        
        const [time, value] = line.split(",");
        if (Math.trunc(+time) === prev) {
          continue;
        }
        prev = Math.trunc(+time);
        
        await new Promise((resolve) => {
          if (isStopped) {
            resolve();
            return;
          }
          
          const timeoutId = setTimeout(() => {
            if (!isStopped) {
              sendToMqttTopic({
                Type: idx,
                Time: Math.trunc(+time),
                Value: +value,
              });
            }
            resolve();
          }, 1000);
          
          timeouts.push(timeoutId);
        });
      }
      
      rl.close();
      stream.close();
    }
  } catch (error) {
    console.error(error);
  } finally {
    timeouts.forEach(clearTimeout);
    streams.forEach(stream => {
      if (stream && typeof stream.close === 'function') {
        stream.close();
      }
    });
    activeStreams.delete(id);
  }
}

export function stopStreaming(id) {
  const streamController = activeStreams.get(id);
  if (streamController) {
    streamController.stop();
  } else {
    console.log(`No active stream found for id: ${id}`);
  }
}
