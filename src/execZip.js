const wait = () =>
  new Promise(resolve => {
    setTimeout(resolve, 1000 + Math.random() * 100);
  });

module.exports = async (path, folder) => {
  console.log("Exec zip:", path);
  await wait();
  console.log("Execed zip:", path);
  return { path };
};

//https://www.npmjs.com/package/adm-zip
//https://github.com/MrKrzYch00/zopfli
