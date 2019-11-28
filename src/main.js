const program = require("commander");
const path = require("path");
const fs = require("fs-extra");
const moment = require("moment");
const momentDurationFormatSetup = require("moment-duration-format");
const exec = require("./exec");

momentDurationFormatSetup(moment);

let folder;
let failedsFile = null;

program
  .version(require("../package.json").version)
  .arguments("<folder>")
  .option("-r, --recursive", "Process recursively", false)
  .option("-f, --faileds <file>", "Retry failed", file => {
    failedsFile = file;
  })
  .action(_folder => {
    folder = _folder;
  })
  .parse(process.argv);

module.exports = async () => {
  if (!fs.exists(path.join(__dirname, "lib"))) {
    console.error(
      "Error: No zopfli(modified) & zopflipng(modified) binary. Get from https://github.com/MrKrzYch00/zopfli/releases"
    );
  }

  if (folder === void 0) {
    console.error("Error: Didn't receive folder arg!");
    return;
  }

  folder = path.resolve(folder);

  let fileStat;
  try {
    fileStat = await fs.lstat(folder);
  } catch {
    console.error("Error: Path doesn't exsist.");
    return;
  }
  if (!fileStat.isDirectory()) {
    console.error("Error: Path is not a directory!");
    return;
  }

  let faileds = null;
  if (failedsFile !== null) {
    faileds = (await fs.readJSON(failedsFile)).map(failed => failed.path);
    console.log(`Detected fails: ${faileds.length}`);
  }

  const startDate = moment();

  const { execedFiles, failedFiles } = await exec(
    folder,
    program.recursive,
    faileds
  );
  console.log("Finished execing.");

  Promise.all([
    fs.outputJSON("./executedFiles.txt", execedFiles),
    fs.outputJSON("./failedFiles.txt", failedFiles)
  ]);
  console.log("Outputed log.");

  const endDate = moment();
  console.log(
    "Elapsed time: ",
    moment.duration(endDate.diff(startDate)).format("hh:mm:ss", { trim: false })
  );
};
