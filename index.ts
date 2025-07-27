import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";

declare module "node:http" {
  /**
   * Augment IncomingMessage to carry our generated/requested ID.
   */
  interface IncomingMessage {
    /**
     * A unique identifier for this request.
     * Populated by the `requestId` middleware.
     */
    requestId?: string;
  }
}

/**
 * Configuration options for the requestId middleware.
 */
export type RequestIdOptions = {
  /**
   * Custom function to generate or extract a request ID.
   * If provided, it will be called with the IncomingMessage.
   * Should return a `string` ID.
   *
   * @default randomUUID()
   */
  generator?: (req: IncomingMessage) => string;

  /**
   * The name of the HTTP header to read/write the request ID.
   *
   * @default "X-Request-Id"
   */
  headerName?: string;

  /**
   * Whether to echo the request ID back on the response.
   *
   * @default true
   */
  setResponseHeader?: boolean;
};

/**
 * Creates a middleware function which:
 * 1. Reads an incoming `headerName` on the request (if present).
 * 2. Otherwise, generates a new UUID (or via your `generator` fn).
 * 3. Optionally sets that ID on the response headers.
 * 4. Attaches the ID as `req.requestId`.
 *
 * @param options Optional configuration.
 * @returns A Connect‑style middleware: `(req, res, next) => void`
 *
 * @example
 * ```ts
 * import http from "node:http";
 * import requestId from "./request-id";
 *
 * const port = 3000;
 *
 * // Create the middleware; use default options
 * const assignId = requestId();
 *
 * const server = http.createServer((req, res) => {
 *   // Manually invoke middleware
 *   assignId(req, res, (err?) => {
 *     if (err) {
 *       res.statusCode = 500;
 *       res.end("Internal Server Error");
 *       return;
 *     }
 *
 *     // Now req.requestId is guaranteed
 *     res.writeHead(200, { "Content-Type": "text/plain" });
 *     res.end(`Hello! Your request ID is ${req.requestId}\n`);
 *   });
 * });
 *
 * server.listen(port, () => {
 *   console.log(`Listening on http://localhost:${port}`);
 * });
 * ```
 *
 * @example Using Express / Connect
 * ```ts
 * import express from "express";
 * import requestId from "./request-id";
 *
 * const app = express();
 *
 * // Customize header name and disable echo
 * app.use(requestId({
 *   headerName: "X-Correlation-Id",
 *   setResponseHeader: false,
 *   generator: (req) => {
 *     // e.g. use some business logic
 *     return req.headers["x-client-id"] as string ?? randomUUID();
 *   },
 * }));
 *
 * app.get("/", (req, res) => {
 *   // req.requestId is available here
 *   res.json({ requestId: req.requestId });
 * });
 *
 * app.listen(4000, () => {
 *   console.log("Express server running on port 4000");
 * });
 * ```
 */
export default function requestId(options?: RequestIdOptions) {
  const headerName = options?.headerName ?? "x-request-id";
  const setResponseHeader = options?.setResponseHeader ?? true;

  return function (
    req: IncomingMessage,
    res: ServerResponse,
    next: (error?: any) => void
  ) {
    // Generate or extract an ID
    const generatedId = options?.generator?.(req) ?? randomUUID();

    // Check for incoming header
    const incomingHeader = req.headers?.[headerName];
    const requestIdValue = Array.isArray(incomingHeader)
      ? incomingHeader?.[0] ?? generatedId
      : incomingHeader ?? generatedId;

    // Optionally echo back
    if (setResponseHeader) {
      res.setHeader(headerName, requestIdValue);
    }

    // Attach to the request object
    req.requestId = requestIdValue;

    // Proceed down the middleware chain
    next();
  };
}
