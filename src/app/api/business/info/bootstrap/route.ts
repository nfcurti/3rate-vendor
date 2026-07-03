import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

const sanitizeBaseUrl = (value: string) => value.trim().replace(/\/$/, "");

const getBackendBaseUrl = () =>
  sanitizeBaseUrl(
    process.env.PAYOH_API_BASE_URL ||
      process.env.NEXT_PUBLIC_PAYOH_API_BASE_URL ||
      ""
  );

const PLACEHOLDER = "-";

export async function POST(request: NextRequest) {
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
      result?: boolean;
      payload?: {
        account?: { _id?: string; email?: string } | null;
        info?: { _id?: string } | null;
      };
      error?: string;
    };

    if (!accountResponse.ok || accountData.error) {
      return NextResponse.json(
        { error: accountData.error || "INVALID_TOKEN" },
        { status: accountResponse.status || 401 }
      );
    }

    const account = accountData.payload?.account;
    const info = accountData.payload?.info;

    if (!account?._id) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    if (info?._id) {
      return NextResponse.json({ result: true, payload: { created: false } });
    }

    const client = await getMongoClient();
    const collection = client.db().collection("businessinfomodels");
    const now = new Date();

    await collection.insertOne({
      businessAccountId: account._id,
      ragioneSociale: PLACEHOLDER,
      partitaIVA: PLACEHOLDER,
      codiceFiscale: PLACEHOLDER,
      codiceSDI: PLACEHOLDER,
      fullAddress: PLACEHOLDER,
      cap: PLACEHOLDER,
      city: PLACEHOLDER,
      province: PLACEHOLDER,
      region: PLACEHOLDER,
      email: account.email ?? PLACEHOLDER,
      pec: PLACEHOLDER,
      phoneNumber: PLACEHOLDER,
      whatsappNumber: PLACEHOLDER,
      isBlocked: false,
      stripeConnectOnboardingComplete: false,
      pushNotificationsEnabled: true,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ result: true, payload: { created: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "BOOTSTRAP_FAILED";

    if (message === "MONGODB_NOT_CONFIGURED") {
      return NextResponse.json({ error: "MONGODB_NOT_CONFIGURED" }, { status: 503 });
    }

    console.error("[business-info/bootstrap]", error);
    return NextResponse.json({ error: "BOOTSTRAP_FAILED" }, { status: 500 });
  }
}
