import { NextRequest, NextResponse } from "next/server"

// Simple test endpoint - should be public
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Public endpoint working\!",
    timestamp: new Date().toISOString(),
    headers: {
      auth: request.headers.get("authorization"),
      apiKey: request.headers.get("x-api-key")
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({
      message: "POST received",
      data: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    )
  }
}
