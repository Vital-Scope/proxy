import fs from "fs/promises";
import path from "path";

const hypoxiaDir = path.join(process.cwd(), "dataset/hypoxia");
const regularDir = path.join(process.cwd(), "dataset/regular");
const datasetList = [hypoxiaDir, regularDir];

export async function getDirectoryContent(url) {
  return await fs.readdir(url);
}

export async function getRandomFiles(type = 0) {
  const datasetTypePath = datasetList[type];
  const dirs = await getDirectoryContent(datasetTypePath);
  const randomDir = dirs[Math.floor(Math.random() * dirs.length)];

  const bpmDir = await getDirectoryContent(
    path.join(datasetTypePath, randomDir, "bpm")
  );
  const uterusDir = await getDirectoryContent(
    path.join(datasetTypePath, randomDir, "uterus")
  );
  const randomIndex = Math.floor(Math.random() * bpmDir.length);

  return [
    path.join(datasetTypePath, randomDir, "bpm", bpmDir[randomIndex]),
    path.join(datasetTypePath, randomDir, "uterus", uterusDir[randomIndex]),
  ];
}

export async function createDirectories(id) {
  const baseDir = path.join(process.cwd(), process.env.DIR_PATH, id);
  const bpmDir = path.join(baseDir, "bpm");
  const uterusDir = path.join(baseDir, "uterus");

  await fs.mkdir(baseDir, { recursive: true });
  await fs.mkdir(bpmDir, { recursive: true });
  await fs.mkdir(uterusDir, { recursive: true });

  return { baseDir, bpmDir, uterusDir };
}

export async function copyFiles(files, id) {
  const { bpmDir, uterusDir } = await createDirectories(id);
  
  const bpmFileName = path.basename(files[0]);
  const uterusFileName = path.basename(files[1]);
  
  await fs.copyFile(files[0], path.join(bpmDir, bpmFileName));
  await fs.copyFile(files[1], path.join(uterusDir, uterusFileName));
}
