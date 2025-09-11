"use client"

import { useEffect, useState } from "react"

interface ElapsedTimerProps {
  start: string
  warnAtMinutes?: number
  className?: string
}

export function ElapsedTimer({ start, warnAtMinutes, className = "" }: ElapsedTimerProps) {
  const [elapsed, setElapsed] = useState("")
  const [isOverdue, setIsOverdue] = useState(false)

  useEffect(() => {
    const updateTimer = () => {
      const startTime = new Date(start).getTime()
      const now = Date.now()
      const diff = now - startTime

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)

      setElapsed(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)

      if (warnAtMinutes && minutes >= warnAtMinutes) {
        setIsOverdue(true)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [start, warnAtMinutes])

  return (
    <span
      className={`${
        isOverdue ? "text-red-600 font-semibold bg-red-50 px-1 py-0.5 rounded" : "text-white/90 font-medium"
      } ${className}`}
    >
      {elapsed}
    </span>
  )
}
