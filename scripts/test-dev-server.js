#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require("child_process");
const http = require("http");

let serverReady = false;
let hasErrors = false;
const errors = [];

// Start the dev server
const devServer = spawn("pnpm", ["dev", "--turbopack"], {
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
});

// Capture stdout
devServer.stdout.on("data", (data) => {
  const output = data.toString();
  process.stdout.write(output);

  if (output.includes("Ready in")) {
    serverReady = true;
  }
});

// Capture stderr and look for errors
devServer.stderr.on("data", (data) => {
  const output = data.toString();
  process.stderr.write(output);

  // Check for various error patterns
  if (
    output.includes("TypeError:") ||
    output.includes("ReferenceError:") ||
    output.includes("Error:") ||
    output.includes("⨯")
  ) {
    hasErrors = true;
    errors.push(output);
  }
});

// Wait for server to be ready, then make a test request
const checkServer = setInterval(() => {
  if (serverReady) {
    clearInterval(checkServer);

    // Make a request to trigger rendering
    http
      .get("http://localhost:3000", (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          // Wait a bit more to catch any async errors
          setTimeout(() => {
            if (hasErrors) {
              console.error("\n\n❌ Runtime errors detected:\n");
              errors.forEach((err) => console.error(err));
              devServer.kill();
              process.exit(1);
            } else if (res.statusCode >= 500) {
              console.error(
                `\n\n❌ Server returned error status: ${res.statusCode}`,
              );
              devServer.kill();
              process.exit(1);
            } else {
              console.log(
                "\n\n✅ Dev server is running without runtime errors!",
              );
              devServer.kill();
              process.exit(0);
            }
          }, 8000);
        });
      })
      .on("error", (err) => {
        console.error("\n\n❌ Could not connect to dev server:", err.message);
        devServer.kill();
        process.exit(1);
      });
  }
}, 1000);

// Timeout after 30 seconds
setTimeout(() => {
  console.error("\n\n❌ Timeout: Dev server did not start within 30 seconds");
  devServer.kill();
  process.exit(1);
}, 30000);
