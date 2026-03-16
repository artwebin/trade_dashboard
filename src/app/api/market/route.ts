import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://watchtower-api.xprdata.org/api/market", {
      next: { revalidate: 60 }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch market data: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Market API proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}
