const util = require("util");
const fs = require("fs-extra");
const path = require("path");
const { execFile } = require("child_process");

const zopflipngPath = path.join(__dirname, "../lib/zopflipng");

module.exports = async (file, folder) => {
  console.log("Exec png:", file);
  if (await fs.exists(`${file}z`)) {
    throw { stdout: `${file}z exists!` };
  }

  let res
  try {
    res = await util.promisify(execFile)(zopflipngPath, [
      "--t=4",
      "--all",
      "--mui=1",
      "--iterations=5",
      "--filters=01234mywebpg",
      `${file}`,
      `${file}z`
    ]);
  } catch {
    console.log("Failed to exec png and retrying: ", file)
    try {
      res = await util.promisify(execFile)(zopflipngPath, [
        "--t=4",
        "--mui=1",
        "--iterations=5",
        "--filters=01234mywebpg",
        `${file}`,
        `${file}z`
      ]);
    } catch (e) {
      console.log("Failed to exec png (already retried):", file);
      console.error(e, e.stdout);
      throw { path: file, err: e.stdout };
    }
  }

  try {
    await fs.ensureDir("tmp");
    await fs.move(file, path.join("tmp", path.relative(folder, file)));
    await fs.move(`${file}z`, file);

    console.log("Execed png:", file);

    const out = res.stdout
      .split("\n")
      .filter(
        line => line.includes("Input size") || line.includes("Result size")
      )
      .join("\n");
    console.log(out);

    return { path: file, res: out };
  } catch (e) {
    console.log("Failed to exec png:", file);
    console.error(e, e.stdout);
    throw { path: file, err: e.stdout };
  }
};
