import { randomUUID } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import type { Socket } from "node:net";

interface Session {
  readonly id: string;
  readonly csrf: string;
}

interface Item {
  readonly id: string;
  readonly name: string;
  readonly owner: string;
}

export interface DemoSnapshot {
  readonly sessions: number;
  readonly items: number;
  readonly activeRequests: number;
  readonly activeSockets: number;
}

export interface DemoService {
  readonly baseURL: string;
  readonly username: string;
  readonly password: string;
  readonly generatedSecrets: ReadonlySet<string>;
  snapshot(): DemoSnapshot;
  close(): Promise<void>;
}

function json(
  response: ServerResponse,
  status: number,
  value: unknown,
  headers = {},
): void {
  response.writeHead(status, {
    "content-type": "application/json",
    ...headers,
  });
  response.end(JSON.stringify(value));
}

async function requestBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function startDemoService(): Promise<DemoService> {
  const username = `starter-${randomUUID()}`;
  const password = randomUUID();
  const sessions = new Map<string, Session>();
  const items = new Map<string, Item>();
  const sockets = new Set<Socket>();
  const generatedSecrets = new Set<string>([username, password]);
  let activeRequests = 0;

  function currentSession(request: IncomingMessage): Session | undefined {
    const id = /(?:^|; )sid=([^;]+)/u.exec(request.headers.cookie ?? "")?.[1];
    return id === undefined ? undefined : sessions.get(id);
  }

  const server = createServer(async (request, response) => {
    activeRequests += 1;
    try {
      if (request.method === "POST" && request.url === "/login") {
        const input = (await requestBody(request)) as {
          username?: unknown;
          password?: unknown;
        };
        if (input.username !== username || input.password !== password) {
          return json(response, 401, { message: "denied" });
        }
        const id = randomUUID();
        const csrf = randomUUID();
        sessions.set(id, { id, csrf });
        generatedSecrets.add(id);
        generatedSecrets.add(csrf);
        return json(
          response,
          200,
          { csrf },
          { "set-cookie": `sid=${id}; Path=/; HttpOnly` },
        );
      }

      const session = currentSession(request);
      if (
        session === undefined ||
        request.headers["x-csrf-token"] !== session.csrf
      ) {
        return json(response, 403, { message: "denied" });
      }

      if (request.method === "POST" && request.url === "/logout") {
        sessions.delete(session.id);
        response.writeHead(204);
        return response.end();
      }

      if (request.method === "POST" && request.url === "/items") {
        const input = (await requestBody(request)) as { name?: unknown };
        if (typeof input.name !== "string" || input.name.length === 0) {
          return json(response, 400, { message: "invalid" });
        }
        const item = { id: randomUUID(), name: input.name, owner: session.id };
        items.set(item.id, item);
        return json(response, 201, { id: item.id, name: item.name });
      }

      const id = request.url?.split("/")[2];
      const item = id === undefined ? undefined : items.get(id);
      if (item === undefined || item.owner !== session.id) {
        return json(response, 404, { message: "missing" });
      }
      if (request.method === "GET")
        return json(response, 200, { id: item.id, name: item.name });
      if (request.method === "DELETE") {
        items.delete(item.id);
        response.writeHead(204);
        return response.end();
      }
      return json(response, 404, { message: "missing" });
    } catch {
      return json(response, 500, { message: "request failed" });
    } finally {
      activeRequests -= 1;
    }
  });
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  if (address === null || typeof address === "string")
    throw new Error("Demo server did not bind.");

  return {
    baseURL: `http://127.0.0.1:${address.port}`,
    username,
    password,
    generatedSecrets,
    snapshot() {
      return {
        sessions: sessions.size,
        items: items.size,
        activeRequests,
        activeSockets: [...sockets].filter((socket) => !socket.destroyed)
          .length,
      };
    },
    async close() {
      const closed = new Promise<void>((resolve, reject) => {
        server.close((error) =>
          error === undefined ? resolve() : reject(error),
        );
      });
      server.closeAllConnections();
      await closed;
      await new Promise<void>((resolve) => setImmediate(resolve));
    },
  };
}
