import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/middleware"
import { createStoryCard, listStoryCards } from "@/lib/storyCardSchema"

export async function GET(request: NextRequest) {
  const authResult = await withAdminAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    return NextResponse.json(await listStoryCards())
  } catch (error) {
    console.error("Get story cards error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await withAdminAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const card = await createStoryCard(body, authResult.user.userId)
    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid story card"
    const status = message.includes("required") || message.includes("vocabulary") ? 400 : 500
    if (status === 500) console.error("Create story card error:", error)
    return NextResponse.json({ error: message }, { status })
  }
}
