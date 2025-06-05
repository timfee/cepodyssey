/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require("child_process");
const http = require("http");

const PORT = 3000;
const RETRY_INTERVAL = 1000;
const MAX_RETRIES = 20; // 20 seconds total

// Start the Next.js dev server
const server = spawn("pnpm", ["dev"], {
  stdio: "pipe", // Use pipe to capture stdout/stderr
  detached: true, // Allows us to kill the process group
});

console.log(`🚀 Starting Next.js dev server with PID: ${server.pid}...`);

let output = "";
server.stdout.on("data", (data) => {
  const dataStr = data.toString();
  console.log(dataStr); // Log server output for debugging
  output += dataStr;
});

server.stderr.on("data", (data) => {
  console.error(`SERVER_ERROR: ${data.toString()}`);
});

let retries = 0;
const checkServer = () => {
  if (output.includes("✓ Ready in")) {
    console.log("✅ Server is ready. Attempting to fetch homepage...");

    http
      .get(`http://localhost:${PORT}`, (res) => {
        console.log(`Received status code: ${res.statusCode}`);

        if (res.statusCode === 200) {
          console.log(
            "✅ Homepage fetch successful (200 OK). Server test passed."
          );
          killServerAndExit(0);
        } else {
          console.error(
            `❌ Test failed. Server responded with status: ${res.statusCode}`
          );
          killServerAndExit(1);
        }
      })
      .on("error", (err) => {
        console.error("❌ Fetch error:", err.message);
        killServerAndExit(1);
      });
  } else if (retries < MAX_RETRIES) {
    retries++;
    console.log(
      `... Server not ready yet. Retrying in ${RETRY_INTERVAL}ms... (${retries}/${MAX_RETRIES})`
    );
    setTimeout(checkServer, RETRY_INTERVAL);
  } else {
    console.error("❌ Server failed to start within the timeout period.");
    killServerAndExit(1);
  }
};

function killServerAndExit(exitCode) {
  console.log("Shutting down dev server...");
  // Kill the entire process group to ensure the Next.js server also terminates
  try {
    process.kill(-server.pid, "SIGKILL");
  } catch (e) {
    console.warn(
      `Could not kill server process group (PID: ${server.pid}). It may have already exited.`,
      e
    );
  }
  process.exit(exitCode);
}

// Start the checking loop
setTimeout(checkServer, RETRY_INTERVAL);

// Ensure we clean up the server on script exit
process.on("exit", () => killServerAndExit(0));
process.on("SIGINT", () => killServerAndExit(0));
process.on("SIGTERM", () => killServerAndExit(0));
