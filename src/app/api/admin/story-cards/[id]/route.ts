import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/middleware"
import { deleteStoryCard } from "@/lib/storyCardSchema"

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authResult = await withAdminAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { id } = await context.params
    await deleteStoryCard(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete story card error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
