import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json([], { status: 200 })
  }

  // Fetch the user by email
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json([], { status: 404 })
  }

  // Fetch the latest time for this user
  const time = await prisma.time.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 1,
  })

  return NextResponse.json(time)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { duration } = await req.json()

    // Fetch the user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user has already played
    const existing = await prisma.time.findFirst({
      where: { userId: user.id },
    })

    if (existing) {
      return NextResponse.json({ error: "Already played" }, { status: 400 })
    }

    // Create new time record
    const newTime = await prisma.time.create({
      data: {
        userId: user.id,
        duration,
      },
    })

    return NextResponse.json(newTime)
  } catch (err) {
    console.error("Error saving time:", err)
    return NextResponse.json({ error: "Failed to save time" }, { status: 500 })
  }
}
