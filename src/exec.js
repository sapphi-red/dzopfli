const klaw = require("klaw");
const path = require("path");
const execZip = require("./execZip");
const execPng = require("./execPng");

const concurrency = 8;

const getIter = (folder, recursive) =>
  klaw(folder, {
    depthLimit: recursive ? -1 : 0
  });

module.exports = async (folder, recursive, faileds) => {
  const execingFiles = new Set();
  const execedFiles = [];
  const failedFiles = [];
  const execingPromises = [];

  const res1 = getIter(folder, recursive);
  let total = 0;
  for await (const file of res1) {
    if (!file.stats.isFile()) continue;

    if (faileds !== null) {
      if (!faileds.includes(file.path)) continue;
    }

    const ext = path.extname(file.path);
    if (ext !== ".zip" && ext !== ".png") continue;
    total++;
  }
  console.log(`Total: ${total}`)

  const res = getIter(folder, recursive);
  let count = 0;
  for await (const file of res) {
    if (!file.stats.isFile()) continue;

    if (faileds !== null) {
      if (!faileds.includes(file.path)) continue;
    }

    const ext = path.extname(file.path);
    if (ext !== ".zip" && ext !== ".png") continue;

    while (execingFiles.size >= concurrency) {
      await Promise.race(execingPromises);
    }

    execingFiles.add(file.path);

    let execing;

    if (ext === ".zip") {
      execing = execZip(file.path, folder);
    } else if (ext === ".png") {
      execing = execPng(file.path, folder);
    }

    execing
      .then(
        ({ path, res }) => {
          execedFiles.push({ path, res });
          return path;
        },
        ({ path, err }) => {
          failedFiles.push({ path, err });
          return path;
        }
      )
      .then(path => {
        execingFiles.delete(path);
        const index = execingPromises.findIndex(v => v === execing);
        execingPromises.splice(index, 1);
        count++;
        console.log(`Execed: ${count} / ${total}`)
      });

    execingPromises.push(execing);
  }

  await Promise.all(execingPromises);

  return {
    execedFiles,
    failedFiles
  };
};
