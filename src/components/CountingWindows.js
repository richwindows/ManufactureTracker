'use client'

import { useState, useEffect } from 'react'
import { Clock, BarChart3, Calendar, Wifi, WifiOff, X } from 'lucide-react'

export default function FullScreenDisplay({ isCompact = false }) {
  const [todayCount, setTodayCount] = useState(0)
  const [highestRecord, setHighestRecord] = useState({ count: 0, date: '' })
  const [currentTime, setCurrentTime] = useState(null)
  const [currentDate, setCurrentDate] = useState(null)
  const [isVisible, setIsVisible] = useState(true)
  const [showTodayModal, setShowTodayModal] = useState(false)
  const [todayBarcodes, setTodayBarcodes] = useState([])
  const [loadingBarcodes, setLoadingBarcodes] = useState(false)

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

  // Fetch today's barcodes
  const fetchTodayBarcodes = async () => {
    setLoadingBarcodes(true)
    try {
      const response = await fetch('/api/barcodes?action=today-list')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      setTodayBarcodes(data || [])
    } catch (error) {
      console.error('Error fetching today barcodes:', error)
      setTodayBarcodes([])
    } finally {
      setLoadingBarcodes(false)
    }
  }

  // Handle today count click
  const handleTodayCountClick = () => {
    setShowTodayModal(true)
    fetchTodayBarcodes()
  }

  // Format date time for display
  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
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

  // Handle keyboard events for toggling visibility (only in full screen mode)
  useEffect(() => {
    if (!isCompact) {
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
    }
  }, [isVisible, isCompact])

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

  if (!isVisible && !isCompact) {
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

  // 紧凑模式布局
  if (isCompact) {
    return (
      <>
        <div className="h-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            {/* 今日总数 */}
            <div 
              className="flex flex-col items-center justify-center bg-white/8 backdrop-blur-md border border-white/15 shadow-xl rounded-2xl p-4 cursor-pointer hover:bg-white/12 transition-all duration-300"
              onClick={handleTodayCountClick}
            >
              <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-red-400 via-pink-500 to-rose-400 bg-clip-text text-transparent mb-2">
                今日总数
              </h2>
              <div className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                {todayCount}
              </div>
            </div>

            {/* 最高记录 */}
            <div className="flex flex-col items-center justify-center bg-white/8 backdrop-blur-md border border-white/15 shadow-xl rounded-2xl p-4">
              <div className="flex items-center mb-2">
                <BarChart3 className="w-5 h-5 text-cyan-400 mr-2" />
                <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  最高记录
                </h3>
              </div>
              <div className="text-center">
                <div className="text-sm text-cyan-300 mb-1">
                  {formatDisplayDate(highestRecord.date)}
                </div>
                <div className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  {highestRecord.count}
                </div>
              </div>
            </div>

            {/* 当前时间和日期 */}
            <div className="flex flex-col items-center justify-center bg-white/8 backdrop-blur-md border border-white/15 shadow-xl rounded-2xl p-4">
              <div className="flex items-center mb-2">
                <Calendar className="w-5 h-5 text-emerald-400 mr-2" />
                <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
                  当前时间
                </h3>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-white mb-1">
                  {currentDate ? formatDate(currentDate) : '--'}
                </div>
                <div className="text-xl md:text-3xl font-bold text-emerald-300">
                  {currentTime ? formatTime(currentTime) : '--:--:--'}
                </div>
              </div>
              {connectionError && (
                <div className="flex items-center mt-2">
                  <WifiOff className="w-4 h-4 text-red-400 mr-1" />
                  <span className="text-xs text-red-400">连接中断</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 今日条码列表模态框 */}
        {showTodayModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowTodayModal(false)}
          >
            <div 
              className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div>
                  <h3 className="text-xl font-bold">今日扫描条码列表</h3>
                  <p className="text-sm text-blue-100 mt-1">
                    {currentDate ? formatDate(currentDate) : new Date().toLocaleDateString('en-CA')}
                  </p>
                </div>
                <button
                  onClick={() => setShowTodayModal(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {loadingBarcodes ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">加载今日数据中...</div>
                  </div>
                ) : todayBarcodes.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 mb-4 bg-blue-50 p-2 rounded">
                      今日共扫描 <span className="font-bold text-blue-600">{todayBarcodes.length}</span> 个条码
                    </div>
                    {todayBarcodes.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500 w-8">
                            {index + 1}
                          </span>
                          <span className="font-mono bg-yellow-200 px-2 py-1 rounded text-sm font-semibold">
                            {item.barcode}
                          </span>
                          {item.device_port && (
                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                              端口: {item.device_port}
                            </span>
                          )}
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                            {item.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDateTime(item.scannedAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-2">今日暂无扫描记录</div>
                    <div className="text-sm text-gray-400">
                      {currentDate ? formatDate(currentDate) : new Date().toLocaleDateString('en-CA')} 还没有条码扫描
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // 全屏模式布局
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col lg:flex-row">
        {/* Left Section - Today's Count */}
        <div className="flex-1 lg:flex-[7] flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 lg:border-r-4 border-blue-400/30 shadow-2xl min-h-[50vh] lg:min-h-screen">
          <div 
            className="text-center p-6 lg:p-12 rounded-3xl bg-white/8 backdrop-blur-md border border-white/15 shadow-2xl max-w-4xl mx-auto cursor-pointer hover:bg-white/12 transition-all duration-300"
            onClick={handleTodayCountClick}
          >
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
          <div className="flex flex-col items-center justify-center text-center p-4 lg:p-6 rounded-2xl bg-white/12 backdrop-blur-md border border-white/25 shadow-xl hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center justify-center mb-4 lg:mb-6">
              <BarChart3 className="w-8 h-8 lg:w-12 lg:h-12 text-cyan-400 mr-3 lg:mr-4 drop-shadow-lg" />
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Best Record
              </h2>
            </div>
            
            <div className="space-y-3 lg:space-y-4">
              <div className="flex flex-col items-center justify-center gap-2 lg:gap-4">
                <span className="text-lg sm:text-xl lg:text-3xl xl:text-4xl font-bold text-cyan-300">
                  Date:
                </span>
                <span className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-lg">
                  {formatDisplayDate(highestRecord.date)}
                </span>
              </div>
              
              <div className="flex flex-col items-center justify-center gap-2 lg:gap-4">
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
          <div className="flex flex-col items-center justify-center text-center p-4 lg:p-6 rounded-2xl bg-white/12 backdrop-blur-md border border-white/25 shadow-xl hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center justify-center mb-4 lg:mb-6">
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
          <div className="flex flex-col items-center justify-center text-center p-4 lg:p-6 rounded-2xl bg-white/12 backdrop-blur-md border border-white/25 shadow-xl hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center justify-center mb-4 lg:mb-6">
              <Clock className="w-8 h-8 lg:w-12 lg:h-12 text-blue-400 mr-3 lg:mr-4 drop-shadow-lg" />
              <h3 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Current Time
              </h3>
            </div>
            <div className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white drop-shadow-lg font-mono mb-4 lg:mb-6">
              {currentTime ? formatTime(currentTime) : '--:--:--'}
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center justify-center">
              {connectionError ? (
                <>
                  <WifiOff className="w-6 h-6 lg:w-8 lg:h-8 text-red-400 mr-2 lg:mr-3" />
                  <span className="text-lg lg:text-2xl text-red-400 font-semibold">连接中断</span>
                </>
              ) : (
                <>
                  <Wifi className="w-6 h-6 lg:w-8 lg:h-8 text-green-400 mr-2 lg:mr-3" />
                  <span className="text-lg lg:text-2xl text-green-400 font-semibold">连接正常</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}