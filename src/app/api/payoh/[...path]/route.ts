import { NextRequest, NextResponse } from "next/server";

const sanitizeBaseUrl = (value: string) => value.trim().replace(/\/$/, "");

const getBackendBaseUrl = () =>
  sanitizeBaseUrl(
    process.env.PAYOH_API_BASE_URL ||
      process.env.NEXT_PUBLIC_PAYOH_API_BASE_URL ||
      ""
  );

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MAX_PROXY_ATTEMPTS = 3;

const isHtmlBody = (contentType: string, body: string) =>
  contentType.includes("text/html") || body.trimStart().startsWith("<!DOCTYPE");

const hasBackendErrorJson = (body: string) => {
  try {
    const parsed = JSON.parse(body) as { error?: unknown };
    return typeof parsed.error === "string";
  } catch {
    return false;
  }
};

const isGatewayFailure = (status: number, contentType: string, body: string) => {
  if (isHtmlBody(contentType, body)) return true;
  if (status === 500 && !hasBackendErrorJson(body)) return true;
  if (status !== 502 && status !== 503) return false;
  return !hasBackendErrorJson(body);
};

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const backendBase = getBackendBaseUrl();

  if (!backendBase) {
    console.error(
      "[payoh-proxy] Missing PAYOH_API_BASE_URL or NEXT_PUBLIC_PAYOH_API_BASE_URL"
    );
    return NextResponse.json(
      {
        error: "API_NOT_CONFIGURED",
        path: pathSegments.join("/"),
        method: request.method,
      },
      { status: 503 }
    );
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = `${backendBase}/${pathSegments.join("/")}${incomingUrl.search}`;
  const routePath = `/${pathSegments.join("/")}`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("ngrok-skip-browser-warning", "true");

  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("Authorization", authorization);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.text();
    if (body) init.body = body;
  }

  for (let attempt = 1; attempt <= MAX_PROXY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(targetUrl, init);
      const responseBody = await response.text();
      const contentType = response.headers.get("content-type") ?? "";

      if (isGatewayFailure(response.status, contentType, responseBody)) {
        if (attempt < MAX_PROXY_ATTEMPTS) {
          await sleep(200 * attempt);
          continue;
        }

        console.error(
          `[payoh-proxy] ${request.method} ${routePath} -> ${response.status} (upstream gateway error after ${MAX_PROXY_ATTEMPTS} attempts)`
        );

        return NextResponse.json(
          {
            error: "NETWORK_ERROR",
            path: routePath,
            method: request.method,
          },
          { status: 502 }
        );
      }

      return new NextResponse(responseBody, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("content-type") || "application/json",
        },
      });
    } catch (error) {
      if (attempt < MAX_PROXY_ATTEMPTS) {
        await sleep(200 * attempt);
        continue;
      }

      const details = error instanceof Error ? error.message : "Failed to fetch";
      console.error(`[payoh-proxy] ${request.method} ${targetUrl} (${details})`);

      return NextResponse.json(
        {
          error: "NETWORK_ERROR",
          path: routePath,
          method: request.method,
        },
        { status: 502 }
      );
    }
  }

  return NextResponse.json(
    {
      error: "NETWORK_ERROR",
      path: routePath,
      method: request.method,
    },
    { status: 502 }
  );
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}
