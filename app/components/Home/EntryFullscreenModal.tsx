'use client'

import { useState, useEffect, useCallback } from 'react'

export default function EntryFullscreenModal() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(true)
  }, [])

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen()
    } catch (err) {
      console.error('Failed to enter fullscreen:', err)
    } finally {
      setShow(false)
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-8 text-center shadow-lg pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold">
          Welcome to StarManag!
        </h2>
        <p className="mb-5 sm:mb-6 text-sm sm:text-base text-gray-700">
          For the best experience, please enter fullscreen mode.
        </p>
        <button
          onClick={enterFullscreen}
          className="w-full min-h-11 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        >
          Enter Fullscreen
        </button>
      </div>
    </div>
  )
}
