import { NextRequest, NextResponse } from "next/server";

// Server-side only — not exposed to client. No Mixed Content issue.
const BOT_API = process.env.BOT_API_URL || "http://46.4.229.254:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params, "DELETE");
}

async function proxyRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  // path = ["api", "status"] → forwards to BOT_API/api/status
  const path = params.path.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const targetUrl = `${BOT_API}/${path}${searchParams ? `?${searchParams}` : ""}`;

  try {
    let body: string | undefined;
    if (method !== "GET" && method !== "DELETE") {
      try {
        body = await request.text();
      } catch {
        body = undefined;
      }
    }

    const response = await fetch(targetUrl, {
      method,
      headers: { "Content-Type": "application/json" },
      body,
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error(`Proxy error → ${targetUrl}:`, error);
    return NextResponse.json(
      { error: "Bot API unreachable", detail: String(error) },
      { status: 503 }
    );
  }
}
