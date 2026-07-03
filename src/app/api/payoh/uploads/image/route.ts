import { NextRequest, NextResponse } from "next/server";

const getBackendBaseUrl = () =>
  (process.env.PAYOH_API_BASE_URL || process.env.NEXT_PUBLIC_PAYOH_API_BASE_URL || "")
    .trim()
    .replace(/\/$/, "");

export async function POST(request: NextRequest) {
  const backendBase = getBackendBaseUrl();
  const uploadKey = process.env.PAYOH_UPLOAD_KEY;

  if (!backendBase || !uploadKey) {
    return NextResponse.json({ error: "API_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const response = await fetch(`${backendBase}/uploads/image`, {
      method: "POST",
      headers: {
        permission: `Bearer ${uploadKey}`,
      },
      body: formData,
      cache: "no-store",
    });

    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Failed to fetch";
    console.error(`[payoh-upload] ${details}`);
    return NextResponse.json({ error: "NETWORK_ERROR" }, { status: 502 });
  }
}
