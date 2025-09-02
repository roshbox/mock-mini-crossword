"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type WordInput = {
  word: string
  clue: string
  row: number
  column: number
  direction: "across" | "down"
}

const ADMIN_EMAILS = ["roshnitoday@gmail.com"]

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rows, setRows] = useState(5)
  const [columns, setColumns] = useState(5)
  const [words, setWords] = useState<WordInput[]>([
    { word: "", clue: "", row: 0, column: 0, direction: "across" },
  ])
  const [message, setMessage] = useState("")
  const [toast, setToast] = useState("")

  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email)

  // Redirect if not signed in or not admin
  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      setToast("You need to sign in to access this page.")
      setTimeout(() => router.replace("/"), 1500)
    } else if (!isAdmin) {
      setToast("Unauthorized: Only admins can access this page.")
      setTimeout(() => router.replace("/"), 1500)
    }
  }, [session, status, isAdmin, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return setMessage("Unauthorized")

    try {
      const res = await fetch("/api/admin/crossword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, columns, words }),
      })
      const data = await res.json()
      setMessage(data.error ? `Error: ${data.error}` : "✅ Crossword saved successfully!")
    } catch {
      setMessage("❌ Request failed")
    }
  }

  const handleWordChange = (index: number, field: keyof WordInput, value: string | number) => {
    const newWords = [...words]
    newWords[index][field] = value as never
    setWords(newWords)
  }

  const addWord = () => {
    setWords([...words, { word: "", clue: "", row: 0, column: 0, direction: "across" }])
  }

  const deleteWord = (index: number) => {
    setWords(words.filter((_, i) => i !== index))
  }

  // While loading or unauthorized, show only the toast
  if (status === "loading" || !session || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white font-mono">
        {toast && (
          <div className="bg-gray-800 text-white px-6 py-4 rounded-md shadow-lg text-center">
            {toast}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-8 bg-black min-h-screen text-white font-mono">
      {/* Header with Home Link */}
      <div className="flex justify-between items-center mb-10">
        <Link href="/" className="text-lg font-bold text-white hover:text-blue-400">
          Mock Mini Crossword
        </Link>
      </div>

      {/* Centered Heading */}
      <h1 className="text-2xl font-bold text-center mb-10">📝 Admin Crossword Editor</h1>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        {/* Grid Settings */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block mb-1">Rows</label>
            <input
              type="number"
              value={rows}
              onChange={e => setRows(Number(e.target.value))}
              className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-700"
            />
          </div>
          <div>
            <label className="block mb-1">Columns</label>
            <input
              type="number"
              value={columns}
              onChange={e => setColumns(Number(e.target.value))}
              className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-700"
            />
          </div>
        </div>

        {/* Words Section */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Crossword Words</h2>
          <div className="space-y-4">
            {words.map((w, i) => (
              <div key={i} className="border border-gray-700 p-4 rounded-lg bg-gray-950">
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <input
                    placeholder="Word"
                    value={w.word}
                    onChange={e => handleWordChange(i, "word", e.target.value)}
                    className="col-span-1 bg-gray-900 text-white px-3 py-2 rounded w-full"
                  />
                  <input
                    placeholder="Clue"
                    value={w.clue}
                    onChange={e => handleWordChange(i, "clue", e.target.value)}
                    className="col-span-1 bg-gray-900 text-white px-3 py-2 rounded w-full"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <input
                    type="number"
                    placeholder="Row"
                    value={w.row}
                    onChange={e => handleWordChange(i, "row", Number(e.target.value))}
                    className="bg-gray-900 text-white px-3 py-2 rounded w-full"
                  />
                  <input
                    type="number"
                    placeholder="Column"
                    value={w.column}
                    onChange={e => handleWordChange(i, "column", Number(e.target.value))}
                    className="bg-gray-900 text-white px-3 py-2 rounded w-full"
                  />
                  <select
                    value={w.direction}
                    onChange={e => handleWordChange(i, "direction", e.target.value)}
                    className="bg-gray-900 text-white px-3 py-2 rounded w-full"
                  >
                    <option value="across">Across</option>
                    <option value="down">Down</option>
                  </select>
                </div>
                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => deleteWord(i)}
                  className="mt-2 px-3 py-1 border border-red-500 text-gray rounded hover:bg-red-600 hover:text-white"
                >
                  🗑 Delete Word
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={addWord}
            className="px-4 py-2 border border-gray-700 rounded hover:bg-gray-800"
          >
            ➕ Add Word
          </button>
          <button
            type="submit"
            className="px-6 py-2 border border-gray-700 rounded bg-gray-800 hover:bg-gray-700"
          >
            💾 Save Crossword
          </button>
        </div>
      </form>

      {message && (
        <p className="mt-6 text-center text-green-400 font-semibold">{message}</p>
      )}
    </div>
  )
}
