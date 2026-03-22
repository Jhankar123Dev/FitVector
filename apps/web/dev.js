process.chdir(__dirname);
// Support PORT env variable from preview launcher
if (process.env.PORT) {
  process.argv.push('--port', process.env.PORT);
}
require("next/dist/bin/next");
