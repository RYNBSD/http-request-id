# http-request-id

Middleware to generate or propagate a unique request ID for each HTTP request in Node.js applications.

## Features

- Automatically generate a UUID for incoming HTTP requests.
- Optionally extract an existing ID from an incoming header.
- Attach the ID to the `req` object as `req.requestId`.
- Optionally echo the ID back in the response header.
- Fully typed in TypeScript.

## Installation

```bash
npm install http-request-id
```

or

```bash
yarn add http-request-id
```

## Basic Usage (Node.js `http`)

```ts
import http from "node:http";
import requestId from "http-request-id";

const port = 3000;
const assignId = requestId(); // default options

const server = http.createServer((req, res) => {
  assignId(req, res, (err?) => {
    if (err) {
      res.statusCode = 500;
      res.end("Internal Server Error");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`Hello! Your request ID is ${req.requestId}\n`);
  });
});

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
```

## Express / Connect Usage

```ts
import express from "express";
import requestId from "http-request-id";

const app = express();

app.use(
  requestId({
    headerName: "X-Correlation-Id",
    setResponseHeader: false,
    generator: (req) => {
      // Use client-provided header or fallback to UUID
      return (req.headers["x-client-id"] as string) ?? randomUUID();
    },
  })
);

app.get("/", (req, res) => {
  res.json({ requestId: req.requestId });
});

app.listen(4000, () => {
  console.log("Express server running on port 4000");
});
```

## API Reference

### `requestId(options?: RequestIdOptions): Middleware`

Creates a middleware function that assigns a unique request ID.

#### `RequestIdOptions`

| Option              | Type                               | Default          | Description                                                  |
| ------------------- | ---------------------------------- | ---------------- | ------------------------------------------------------------ |
| `generator`         | `(req: IncomingMessage) => string` | `randomUUID()`   | Custom function to generate or extract a request ID.         |
| `headerName`        | `string`                           | `"X-http-Request-Id"` | HTTP header name to read/write the request ID.               |
| `setResponseHeader` | `boolean`                          | `true`           | Whether to echo the request ID back in the response headers. |

#### Middleware Signature

```ts
(req: IncomingMessage, res: ServerResponse, next: (err?: any) => void) => void
```

On invocation:

1. Reads the header `headerName` from the request (if present).
2. Otherwise, generates a new ID via `generator` or `randomUUID()`.
3. Optionally sets the ID on the response header.
4. Attaches the ID as `req.requestId`.
5. Calls `next()` to proceed.

## Types

This package is written in TypeScript and exports the following types:

```ts
import type { IncomingMessage, ServerResponse } from "node:http";

export interface IncomingMessage {
  /** A unique identifier for this request. */
  requestId?: string;
}

export type RequestIdOptions = {
  generator?: (req: IncomingMessage) => string;
  headerName?: string;
  setResponseHeader?: boolean;
};
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT License. See LICENSE for details.

## Author

Made with ❤️ by [Rayen Boussayed](https://github.com/RYNBSD)
