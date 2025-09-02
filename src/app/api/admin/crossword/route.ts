// src/app/api/admin/crossword/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const ADMIN_EMAILS = ["roshnitoday@gmail.com"]

// Define the type for a crossword word
type WordInput = {
  word: string
  clue: string
  row: number
  column: number
  direction: "across" | "down"
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { rows, columns, words }: { rows: number; columns: number; words: WordInput[] } = await req.json()

    // Delete existing crossword(s)
    await prisma.crosswordWord.deleteMany({})
    await prisma.crossword.deleteMany({})

    // Clear all user times so users can play the new crossword
    await prisma.time.deleteMany({})

    // Create new crossword
    const crossword = await prisma.crossword.create({
      data: {
        rows,
        columns,
        words: {
          create: words.map(w => ({
            word: w.word,
            clue: w.clue,
            row: w.row,
            column: w.column,
            direction: w.direction,
          })),
        },
      },
      include: { words: true },
    })

    return NextResponse.json({ success: true, crossword })
  } catch (err) {
    console.error("Error saving crossword:", err)
    return NextResponse.json({ error: "Failed to save crossword" }, { status: 500 })
  }
}
