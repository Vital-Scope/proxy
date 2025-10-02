import { createReadStream } from "fs";
import * as readline from "node:readline";
import { sendDataToMqtt } from "./mqttUtils.js";

const activeStreams = new Map();

export function hasActiveStream(id) {
  return activeStreams.has(id);
}

export function createStreamController(id) {
  const streams = [];
  const timeouts = [];
  let isStopped = false;

  const controller = {
    isStopped: () => isStopped,
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
    },
    addStream: (stream) => streams.push(stream),
    addTimeout: (timeoutId) => timeouts.push(timeoutId),
    getStreams: () => streams,
    getTimeouts: () => timeouts
  };

  activeStreams.set(id, controller);
  return controller;
}

export function stopStream(id) {
  const streamController = activeStreams.get(id);
  if (streamController) {
    streamController.stop();
  } else {
    console.log(`No active stream found for id: ${id}`);
  }
}

export function cleanupStream(id) {
  const controller = activeStreams.get(id);
  if (controller) {
    controller.getTimeouts().forEach(clearTimeout);
    controller.getStreams().forEach(stream => {
      if (stream && typeof stream.close === 'function') {
        stream.close();
      }
    });
    activeStreams.delete(id);
  }
}

export async function processFile(filePath, fileIndex, controller) {
  if (controller.isStopped()) return;
  
  const stream = createReadStream(filePath);
  controller.addStream(stream);
  
  const rl = readline.createInterface({ input: stream });
  
  let linesRead = 0;
  let prev = 0;
  
  for await (const line of rl) {
    if (controller.isStopped()) break;
    
    if (linesRead === 0) {
      linesRead++;
      continue;
    }
    
    const [time, value] = line.split(",");
    if (Math.trunc(+time) === prev) continue;
    
    prev = Math.trunc(+time);
    
    await processDataLine(time, value, fileIndex, controller);
  }
  
  rl.close();
  stream.close();
}

async function processDataLine(time, value, fileIndex, controller) {
  return new Promise((resolve) => {
    if (controller.isStopped()) {
      resolve();
      return;
    }
    
    const timeoutId = setTimeout(() => {
      if (!controller.isStopped()) {
        sendDataToMqtt({
          Type: fileIndex,
          Time: Math.trunc(+time),
          Value: +value,
        });
      }
      resolve();
    }, 1000);
    
    controller.addTimeout(timeoutId);
  });
}

export async function processFilesInParallel(files, controller) {
  await Promise.all(files.map((filePath, index) => processFile(filePath, index, controller)));
}
