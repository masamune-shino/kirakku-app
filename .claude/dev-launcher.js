const path = require("path");

const nodeBin = "/Users/shinotadashishuu/.nvm/versions/node/v24.18.0/bin";
process.env.PATH = `${nodeBin}:${process.env.PATH || ""}`;

process.argv = [process.argv[0], process.argv[1], "dev", "--webpack"];

require(
  path.join(
    "/Users/shinotadashishuu/Desktop/AI  CAMP２日目",
    "node_modules/next/dist/bin/next",
  ),
);
