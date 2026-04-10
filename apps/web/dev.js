process.chdir(__dirname);

// Support PORT env variable from preview launcher
if (process.env.PORT) {
  process.argv.push('--port', process.env.PORT);
}

// Force IPv4 — Node 17+ resolves localhost to ::1 (IPv6) on Windows,
// which causes Next.js to hang indefinitely before binding.
process.argv.push('--hostname', '127.0.0.1');

// Use Turbopack — avoids webpack worker deadlock on Windows + Node 22,
// and is significantly faster for incremental builds.
process.argv.push('--turbo');

require("next/dist/bin/next");
