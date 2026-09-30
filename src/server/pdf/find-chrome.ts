import { existsSync } from "node:fs";
import { NotFoundError } from "@/server/errors/app-error";

/**
 * PDF export renders the print page through a real Chrome instance (via
 * puppeteer-core) so the exported PDF is pixel-identical to the print
 * layout — no separate PDF template to maintain. puppeteer-core ships no
 * bundled browser, so we point it at whatever Chrome/Chromium is already
 * installed on the machine.
 */
const CANDIDATE_PATHS: string[] = [
  // Windows
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  process.env.LOCALAPPDATA
    ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
    : "",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  // macOS
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  // Linux
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter(Boolean);

let cachedPath: string | null | undefined;

export function findChromeExecutable(): string {
  if (cachedPath !== undefined) {
    if (!cachedPath) {
      throw new NotFoundError(
        "No Chrome/Chromium installation was found for PDF export. Set PUPPETEER_EXECUTABLE_PATH in .env to a Chrome executable, or use the Print button and choose \"Save as PDF\" instead.",
      );
    }
    return cachedPath;
  }

  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath && existsSync(envPath)) {
    cachedPath = envPath;
    return cachedPath;
  }

  const found = CANDIDATE_PATHS.find((path) => existsSync(path));
  cachedPath = found ?? null;

  if (!cachedPath) {
    throw new NotFoundError(
      "No Chrome/Chromium installation was found for PDF export. Set PUPPETEER_EXECUTABLE_PATH in .env to a Chrome executable, or use the Print button and choose \"Save as PDF\" instead.",
    );
  }
  return cachedPath;
}
