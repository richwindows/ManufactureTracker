'use client'

import { useState, useEffect } from 'react'
import { Clock, BarChart3, Calendar, Wifi, WifiOff } from 'lucide-react'

export default function FullScreenDisplay() {
  const [todayCount, setTodayCount] = useState(0)
  const [highestRecord, setHighestRecord] = useState({ count: 0, date: '' })
  const [currentTime, setCurrentTime] = useState(null)
  const [currentDate, setCurrentDate] = useState(null)
  const [isVisible, setIsVisible] = useState(true)

  const [connectionError, setConnectionError] = useState(false)

  // Fetch today's count
  const fetchTodayCount = async () => {
    try {
      const response = await fetch('/api/barcodes?action=today-count')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      setTodayCount(data.count || 0)
      setConnectionError(false)
    } catch (error) {
      console.error('Error fetching today count:', error)
      setConnectionError(true)
      setTodayCount('--')
    }
  }

  // Fetch highest record
  const fetchHighestRecord = async () => {
    try {
      const response = await fetch('/api/barcodes?action=highest-record')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      setHighestRecord({
        count: data.count || 0,
        date: data.date || ''
      })
      setConnectionError(false)
    } catch (error) {
      console.error('Error fetching highest record:', error)
      setConnectionError(true)
      setHighestRecord({
        count: '--',
        date: '数据库连接中断'
      })
    }
  }

  // Update time every second
  useEffect(() => {
    // Set initial time on client side only
    setCurrentTime(new Date())
    setCurrentDate(new Date())
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Update date every minute
  useEffect(() => {
    const dateTimer = setInterval(() => {
      setCurrentDate(new Date())
    }, 60000)

    return () => clearInterval(dateTimer)
  }, [])

  // Fetch data on component mount and every 30 seconds
  useEffect(() => {
    fetchTodayCount()
    fetchHighestRecord()

    const dataTimer = setInterval(() => {
      fetchTodayCount()
      fetchHighestRecord()
    }, 30000)

    return () => clearInterval(dataTimer)
  }, [])

  // Handle keyboard events for toggling visibility
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape') {
        setIsVisible(!isVisible)
      }
      if (event.key === 'F11') {
        event.preventDefault()
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          document.documentElement.requestFullscreen()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isVisible])

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-CA') // YYYY-MM-DD format
  }

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-CA')
  }

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center p-8 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
          <div className="text-white text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
            Press ESC to show display
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col lg:flex-row">
      {/* Left Section - Today's Count */}
      <div className="flex-1 lg:flex-[7] flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 lg:border-r-4 border-blue-400/30 shadow-2xl min-h-[50vh] lg:min-h-screen">
        <div className="text-center p-6 lg:p-12 rounded-3xl bg-white/8 backdrop-blur-md border border-white/15 shadow-2xl max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold bg-gradient-to-r from-red-400 via-pink-500 to-rose-400 bg-clip-text text-transparent mb-6 lg:mb-10 drop-shadow-lg leading-tight">
            Total Windows Today
          </h1>
          <div className="text-[8rem] sm:text-[12rem] md:text-[16rem] lg:text-[20rem] xl:text-[28rem] font-bold bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 bg-clip-text text-transparent leading-none drop-shadow-2xl">
            {todayCount}
          </div>
        </div>
      </div>

      {/* Right Section - Records and Time */}
      <div className="flex-1 lg:flex-[5] flex flex-col justify-center p-4 lg:p-8 space-y-6 lg:space-y-8 min-h-[50vh] lg:min-h-screen">
        {/* Best Record Section */}
        <div className="text-center lg:text-right p-4 lg:p-6 rounded-2xl bg-white/12 backdrop-blur-md border border-white/25 shadow-xl hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center justify-center lg:justify-end mb-4 lg:mb-6">
            <BarChart3 className="w-8 h-8 lg:w-12 lg:h-12 text-cyan-400 mr-3 lg:mr-4 drop-shadow-lg" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Best Record
            </h2>
          </div>
          
          <div className="space-y-3 lg:space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-2 lg:gap-4">
              <span className="text-lg sm:text-xl lg:text-3xl xl:text-4xl font-bold text-cyan-300">
                Date:
              </span>
              <span className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-lg">
                {formatDisplayDate(highestRecord.date)}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-2 lg:gap-4">
              <span className="text-lg sm:text-xl lg:text-3xl xl:text-4xl font-bold text-cyan-300">
                Windows/Day:
              </span>
              <span className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg">
                {highestRecord.count}
              </span>
            </div>
          </div>
        </div>

        {/* Today's Date Section */}
        <div className="text-center lg:text-right p-4 lg:p-6 rounded-2xl bg-white/12 backdrop-blur-md border border-white/25 shadow-xl hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center justify-center lg:justify-end mb-4 lg:mb-6">
            <Calendar className="w-8 h-8 lg:w-12 lg:h-12 text-emerald-400 mr-3 lg:mr-4 drop-shadow-lg" />
            <h3 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
              Today&apos;s Date
            </h3>
          </div>
          <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white drop-shadow-lg mb-2 lg:mb-4">
            {currentDate ? formatDate(currentDate) : '--'}
          </div>
        </div>

        {/* Current Time Section */}
        <div className="text-center lg:text-right p-4 lg:p-6 rounded-2xl bg-white/12 backdrop-blur-md border border-white/25 shadow-xl hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center justify-center lg:justify-end mb-4 lg:mb-6">
            <Clock className="w-8 h-8 lg:w-12 lg:h-12 text-amber-400 mr-3 lg:mr-4 drop-shadow-lg" />
            <h3 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Current Time
            </h3>
          </div>
          <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent drop-shadow-lg">
            {currentTime ? formatTime(currentTime) : '--:--:--'}
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="fixed top-3 right-3 lg:top-6 lg:right-6 flex items-center space-x-2 lg:space-x-3 px-3 py-2 lg:px-4 lg:py-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 shadow-lg hover:bg-white/20 transition-all duration-300">
        {connectionError ? (
          <>
            <WifiOff className="w-5 h-5 lg:w-6 lg:h-6 text-red-400 drop-shadow-lg" />
            <span className="text-red-400 text-sm lg:text-lg font-semibold drop-shadow-lg hidden sm:inline">数据库连接中断</span>
          </>
        ) : (
          <>
            <Wifi className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-400 drop-shadow-lg" />
            <span className="text-emerald-400 text-sm lg:text-lg font-semibold drop-shadow-lg hidden sm:inline">连接正常</span>
          </>
        )}
      </div>

      {/* Instructions overlay */}
      <div className="fixed bottom-3 left-3 lg:bottom-6 lg:left-6 px-3 py-2 lg:px-4 lg:py-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 shadow-lg hover:bg-white/20 transition-all duration-300">
        <div className="text-white/90 text-sm lg:text-lg font-medium drop-shadow-lg">
          <span className="hidden sm:inline">Press ESC to hide/show • Press F11 for fullscreen</span>
          <span className="sm:hidden">ESC • F11</span>
        </div>
      </div>
    </div>
  )
}