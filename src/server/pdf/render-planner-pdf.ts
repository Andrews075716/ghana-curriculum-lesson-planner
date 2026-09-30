import puppeteer from "puppeteer-core";
import { findChromeExecutable } from "./find-chrome";

/**
 * Renders the planner's print page to a PDF by loading the actual print
 * route in headless Chrome — the same HTML/CSS a teacher sees when they
 * print, so the PDF and the on-screen preview can never drift apart.
 * `preferCSSPageSize` defers page size/margins to the `@page` rule in
 * globals.css rather than duplicating that layout decision here.
 *
 * The print route is authenticated (it lives under the `(app)` layout,
 * which calls `verifySession()`), so headless Chrome needs the caller's
 * own session cookie forwarded to it — otherwise it would silently
 * render the login page instead of the planner.
 */
export async function renderPlannerPdf(printUrl: string, cookieHeader: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    executablePath: findChromeExecutable(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    if (cookieHeader) {
      await page.setExtraHTTPHeaders({ Cookie: cookieHeader });
    }
    await page.goto(printUrl, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
