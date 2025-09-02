"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-mono">
      
      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <h1
          onClick={() => router.push("/")}
          className="text-xl font-bold cursor-pointer hover:text-blue-400 transition"
        >
          Mock Mini Crossword
        </h1>

        {session && (
          <div className="flex items-center space-x-3">
            {session.user?.image && (
              <img
                src={session.user.image}
                alt="Profile"
                className="w-10 h-10 rounded-full border border-gray-700"
              />
            )}
            <span className="font-semibold">{session.user?.name}</span>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-grow flex flex-col justify-center items-center text-center px-6">
        {status === "loading" ? (
          <p className="text-gray-400">Loading...</p>
        ) : !session ? (
          <button
            onClick={() => signIn("google")}
            className="px-10 py-4 bg-gray-800 text-gray-200 rounded-lg tracking-wider hover:bg-gray-700 hover:scale-105 transition-transform duration-200"
          >
            Sign in with Google
          </button>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <button
              onClick={() => signOut()}
              className="px-6 py-3 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 hover:scale-105 transition-transform duration-200"
            >
              Sign Out
            </button>
            <button
              onClick={() => router.push("/play")}
              className="px-6 py-3 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 hover:scale-105 transition-transform duration-200"
            >
              Play
            </button>
            <button
              onClick={() => router.push("/admin")}
              className="px-6 py-3 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 hover:scale-105 transition-transform duration-200"
            >
              Admin
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} roshbox
      </footer>
    </div>
  )
}
