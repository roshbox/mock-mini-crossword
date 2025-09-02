import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const crossword = await prisma.crossword.findFirst({
      orderBy: { createdAt: "desc" },
      include: { words: true },
    })

    if (!crossword) {
      return NextResponse.json({ error: "No crossword found" }, { status: 404 })
    }

    return NextResponse.json(crossword)
  } catch (err) {
    console.error("Error fetching crossword:", err)
    return NextResponse.json({ error: "Failed to fetch crossword" }, { status: 500 })
  }
}
