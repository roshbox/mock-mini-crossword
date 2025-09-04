"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

type CrosswordWord = {
  word: string
  clue: string
  row: number
  column: number
  direction: "across" | "down"
}

type Crossword = {
  id: string
  rows: number
  columns: number
  words: CrosswordWord[]
}

export default function PlayPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [crossword, setCrossword] = useState<Crossword | null>(null)
  const [grid, setGrid] = useState<string[][]>([])
  const [solutionGrid, setSolutionGrid] = useState<string[][]>([])
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [canPlay, setCanPlay] = useState(false)
  const [savedTime, setSavedTime] = useState(0)
  const [selectedWord, setSelectedWord] = useState<CrosswordWord | null>(null)
  const [selectedWordDirection, setSelectedWordDirection] = useState<"across" | "down" | null>(null)
  const [cursorPos, setCursorPos] = useState<{ r: number; c: number } | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([])

  // Redirect if not signed in
  useEffect(() => {
    if (status === "loading") return
    if (!session) router.push("/")
  }, [session, status, router])

  // Check if user has already played
  useEffect(() => {
    if (!session?.user?.email) return

    fetch("/api/times")
      .then(res => res.json())
      .then((data: { duration: number }[]) => {
        if (data.length > 0) {
          setHasPlayed(true)
          setSavedTime(data[0].duration)
        } else {
          setCanPlay(true)
        }
      })
      .catch(err => {
        console.error("Failed to fetch times:", err)
        setCanPlay(true)
      })
  }, [session?.user?.email])

  // Timer
  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [isRunning])

  // Initialize crossword
  const initializeCrossword = () => {
    fetch("/api/crossword/current")
      .then(res => res.json())
      .then((data: Crossword) => {
        setCrossword(data)
        const g: string[][] = Array.from({ length: data.rows }, () => Array(data.columns).fill(""))
        setGrid(g)
        const sol: string[][] = Array.from({ length: data.rows }, () => Array(data.columns).fill(""))
        data.words.forEach(w => {
          for (let i = 0; i < w.word.length; i++) {
            const r = w.direction === "down" ? w.row - 1 + i : w.row - 1
            const c = w.direction === "across" ? w.column - 1 + i : w.column - 1
            sol[r][c] = w.word[i].toUpperCase()
          }
        })
        setSolutionGrid(sol)
        inputRefs.current = Array.from({ length: data.rows }, () => Array(data.columns).fill(null))
      })
      .catch(console.error)
  }

  const handlePlayClick = () => {
    initializeCrossword()
    setIsRunning(true)
    setCanPlay(false)
  }

  const handleCellClick = (r: number, c: number, e: React.MouseEvent) => {
    if (!crossword || !isRunning) return
    const direction = e.detail === 2 ? "down" : "across"
    const word = crossword.words.find(w => {
      const startR = w.row - 1
      const startC = w.column - 1
      const endR = startR + (w.direction === "down" ? w.word.length : 1)
      const endC = startC + (w.direction === "across" ? w.word.length : 1)
      return w.direction === direction && r >= startR && r < endR && c >= startC && c < endC
    })
    setSelectedWord(word || null)
    setSelectedWordDirection(word ? word.direction : null)
    setCursorPos({ r, c })

    setTimeout(() => {
      inputRefs.current[r]?.[c]?.focus()
    }, 0)
  }

  const handleChange = (r: number, c: number, value: string) => {
    if (!selectedWordDirection || !isRunning) return

    const correctLetter = solutionGrid[r][c]
    if (grid[r][c] === correctLetter) {
      return // skip over correct square
    }

    const newGrid = grid.map(row => [...row])
    newGrid[r][c] = value.toUpperCase()
    setGrid(newGrid)

    let nextR = r
    let nextC = c
    if (selectedWordDirection === "across") nextC++
    else nextR++

    while (
      inputRefs.current[nextR]?.[nextC] &&
      solutionGrid[nextR]?.[nextC] &&
      newGrid[nextR][nextC] === solutionGrid[nextR][nextC]
    ) {
      if (selectedWordDirection === "across") nextC++
      else nextR++
    }

    if (inputRefs.current[nextR]?.[nextC]) inputRefs.current[nextR][nextC]?.focus()
  }

  const handleKeyDown = (r: number, c: number, e: React.KeyboardEvent) => {
    if (!selectedWordDirection || !isRunning) return
    let nextR = r
    let nextC = c
    switch (e.key) {
      case "Backspace":
        e.preventDefault()
        if (grid[r][c] !== solutionGrid[r][c]) {
          const newGrid = grid.map(row => [...row])
          newGrid[r][c] = ""
          setGrid(newGrid)
        }
        // stay in the same square
        break
      case "Delete":
        e.preventDefault()
        if (grid[r][c] !== solutionGrid[r][c]) {
          const delGrid = grid.map(row => [...row])
          delGrid[r][c] = ""
          setGrid(delGrid)
        }
        break
      case "ArrowLeft":
        e.preventDefault()
        nextC = c - 1
        break
      case "ArrowRight":
        e.preventDefault()
        nextC = c + 1
        break
      case "ArrowUp":
        e.preventDefault()
        nextR = r - 1
        break
      case "ArrowDown":
        e.preventDefault()
        nextR = r + 1
        break
      default:
        return
    }

    while (
      inputRefs.current[nextR]?.[nextC] &&
      solutionGrid[nextR]?.[nextC] &&
      grid[nextR][nextC] === solutionGrid[nextR][nextC]
    ) {
      if (selectedWordDirection === "across") nextC += e.key === "ArrowLeft" ? -1 : 1
      else nextR += e.key === "ArrowUp" ? -1 : 1
    }

    if (inputRefs.current[nextR]?.[nextC]) inputRefs.current[nextR][nextC]?.focus()
  }

  // Check if solved
  useEffect(() => {
    if (!crossword || !solutionGrid.length || hasSaved) return
    const solved = grid.every((row, r) => row.every((cell, c) => !solutionGrid[r][c] || cell === solutionGrid[r][c]))
    if (solved) {
      setIsRunning(false)
      setHasSaved(true)
      fetch("/api/times", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: seconds }),
      })
        .then(() => alert(`Congratulations! You solved the puzzle in ${seconds} seconds.`))
        .catch(console.error)
    }
  }, [grid, crossword, solutionGrid, hasSaved, seconds])

  if (status === "loading") return <p className="text-white">Loading...</p>
  if (!session) return <p className="text-white">Please sign in to play.</p>

  return (
    <div className="p-6 bg-black min-h-screen text-white relative">
      <div
        className="absolute top-4 left-4 font-mono text-lg cursor-pointer hover:text-blue-500 transition"
        onClick={() => router.push("/")}
      >
        Mock Mini Crossword
      </div>

      {hasPlayed && (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <h1 className="text-2xl font-bold mb-4">You’ve already completed the crossword!</h1>
          <p className="text-lg">
            Your recorded time:{" "}
            <span className="font-mono">
              {Math.floor(savedTime / 60)}m {savedTime % 60}s
            </span>
          </p>
        </div>
      )}

      {canPlay && (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-mono mb-6 mt-12">Ready to play the crossword?</h1>
          <button
            onClick={handlePlayClick}
            className="px-6 py-3 border border-gray-600 rounded hover:bg-gray-800 transition"
          >
            Play
          </button>
        </div>
      )}

      {crossword && !canPlay && !hasPlayed && (
        <div className="mt-16">
          <h1 className="text-xl font-mono font-bold text-gray-400 mb-2">Play Crossword</h1>
          <p className="mb-4 font-semibold">
            Time: {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, "0")}
          </p>

          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${crossword.columns}, 40px)` }}>
            {grid.map((rowArr, r) =>
              rowArr.map((cell, c) => {
                const isActive = solutionGrid[r]?.[c] !== ""
                if (!isActive) return <div key={`${r}-${c}`} className="w-10 h-10 bg-gray-900" />

                const isHighlighted =
                  selectedWord &&
                  ((selectedWordDirection === "across" &&
                    r === selectedWord.row - 1 &&
                    c >= selectedWord.column - 1 &&
                    c < selectedWord.column - 1 + selectedWord.word.length) ||
                    (selectedWordDirection === "down" &&
                      c === selectedWord.column - 1 &&
                      r >= selectedWord.row - 1 &&
                      r < selectedWord.row - 1 + selectedWord.word.length))

                return (
                  <input
                    key={`${r}-${c}`}
                    value={cell}
                    onChange={e => handleChange(r, c, e.target.value)}
                    onKeyDown={e => handleKeyDown(r, c, e)}
                    onClick={e => handleCellClick(r, c, e)}
                    maxLength={1}
                    ref={el => {
                      if (!inputRefs.current[r]) inputRefs.current[r] = []
                      if (el) inputRefs.current[r][c] = el
                    }}
                    className={`border w-10 h-10 text-center uppercase text-white bg-gray-800 ${
                      cell && cell.toUpperCase() !== solutionGrid[r][c]
                        ? "bg-red-700"
                        : isHighlighted
                        ? "bg-yellow-500 text-white"
                        : ""
                    }`}
                  />
                )
              })
            )}
          </div>

          <div className="mt-4">
            <h2 className="font-mono font-semibold text-gray-400">Clue:</h2>
            {selectedWord ? <p>{selectedWord.clue}</p> : <p>Click a square to see the clue</p>}
          </div>
        </div>
      )}
    </div>
  )
}
