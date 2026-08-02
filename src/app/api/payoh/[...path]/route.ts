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

const isTextualContentType = (contentType: string) => {
  const normalized = contentType.toLowerCase();
  return (
    normalized.includes("application/json") ||
    normalized.includes("text/") ||
    normalized.includes("application/problem+json") ||
    normalized.includes("application/xml") ||
    normalized.includes("+json")
  );
};

const isGatewayFailure = (status: number, contentType: string, body: string) => {
  if (isHtmlBody(contentType, body)) return true;
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
  const incomingContentType = request.headers.get("content-type") ?? "";
  const isMultipart = incomingContentType.includes("multipart/form-data");

  const headers = new Headers();
  headers.set("ngrok-skip-browser-warning", "true");

  if (isMultipart) {
    headers.set("Content-Type", incomingContentType);
  } else if (incomingContentType) {
    headers.set("Content-Type", incomingContentType);
  } else if (request.method !== "GET" && request.method !== "HEAD") {
    headers.set("Content-Type", "application/json");
  }

  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("Authorization", authorization);
  }

  const permission = request.headers.get("permission");
  if (permission) {
    headers.set("permission", permission);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    if (isMultipart) {
      const body = await request.arrayBuffer();
      if (body.byteLength > 0) init.body = body;
    } else {
      const body = await request.text();
      if (body) init.body = body;
    }
  }

  for (let attempt = 1; attempt <= MAX_PROXY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(targetUrl, init);
      const contentType = response.headers.get("content-type") ?? "";

      // Private Blob media must stay binary — never decode as text.
      if (!isTextualContentType(contentType)) {
        const responseBody = await response.arrayBuffer();
        const responseHeaders = new Headers();
        responseHeaders.set(
          "Content-Type",
          contentType || "application/octet-stream"
        );
        const cacheControl = response.headers.get("cache-control");
        if (cacheControl) responseHeaders.set("Cache-Control", cacheControl);
        return new NextResponse(responseBody, {
          status: response.status,
          headers: responseHeaders,
        });
      }

      const responseBody = await response.text();

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
          "Content-Type": contentType || "application/json",
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
