import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

const sanitizeBaseUrl = (value: string) => value.trim().replace(/\/$/, "");

const getBackendBaseUrl = () =>
  sanitizeBaseUrl(
    process.env.PAYOH_API_BASE_URL ||
      process.env.NEXT_PUBLIC_PAYOH_API_BASE_URL ||
      ""
  );

export async function GET(request: NextRequest) {
  const backendBase = getBackendBaseUrl();
  const authorization = request.headers.get("authorization");

  if (!backendBase || !authorization) {
    return NextResponse.json({ error: "API_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const accountResponse = await fetch(`${backendBase}/business/info/get_account_info`, {
      method: "GET",
      headers: {
        Authorization: authorization,
        "ngrok-skip-browser-warning": "true",
      },
      cache: "no-store",
    });

    const accountData = (await accountResponse.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!accountResponse.ok || accountData.error) {
      return NextResponse.json(
        { error: accountData.error || "INVALID_TOKEN" },
        { status: accountResponse.status || 401 }
      );
    }

    const client = await getMongoClient();
    const statuses = await client
      .db()
      .collection("shippingstatusmodels")
      .find({})
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json({
      result: true,
      payload: statuses.map((status) => ({
        _id: String(status._id),
        name: String(status.name ?? ""),
        code: String(status.code ?? ""),
        message: String(status.message ?? ""),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "STATUSES_FAILED";

    if (message === "MONGODB_NOT_CONFIGURED") {
      return NextResponse.json({ error: "MONGODB_NOT_CONFIGURED" }, { status: 503 });
    }

    console.error("[shipping-statuses]", error);
    return NextResponse.json({ error: "STATUSES_FAILED" }, { status: 500 });
  }
}
