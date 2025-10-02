import { getRandomFiles, copyFiles } from "../utils/fileUtils.js";
import { 
  hasActiveStream, 
  createStreamController, 
  processFilesInParallel, 
  cleanupStream,
  stopStream
} from "../utils/streamUtils.js";

export async function startStreaming(id) {
  if (hasActiveStream(id)) {
    stopStream(id);
  }

  const controller = createStreamController(id);
  
  try {
    const files = await getRandomFiles(0);
    await copyFiles(files, id);
    
    await processFilesInParallel(files, controller);
  } catch (error) {
    console.error(error);
  } finally {
    cleanupStream(id);
  }
}

export function stopStreaming(id) {
  stopStream(id);
}
