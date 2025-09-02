import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const crossword = await prisma.crossword.findFirst({
      orderBy: { createdAt: "desc" },
      include: { words: true },
    })

    // Return empty structure if no crossword exists
    if (!crossword) {
      return NextResponse.json({ id: "", rows: 0, columns: 0, words: [] })
    }

    return NextResponse.json(crossword)
  } catch (err) {
    console.error("Error fetching crossword:", err)
    return NextResponse.json({ error: "Failed to fetch crossword" }, { status: 500 })
  }
}
