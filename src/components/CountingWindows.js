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

  // 移除不需要的API调用
  // const fetchTodayCount = async () => {
  //   // 已移除
  // }

  // const fetchTodayBarcodes = async () => {
  //   // 已移除
  // }

  // const fetchHighestRecord = async () => {
  //   // 已移除
  // }

  // Handle today count click - 移除API调用
  // 恢复数据获取的 useEffect
  useEffect(() => {
    fetchTodayCount()
    fetchHighestRecord()
  
    const dataTimer = setInterval(() => {
      fetchTodayCount()
      fetchHighestRecord()
    }, 30000)
  
    return () => clearInterval(dataTimer)
  }, [])
  
  // 恢复点击事件中的数据获取
  const handleTodayCountClick = () => {
    setShowTodayModal(true)
    fetchTodayBarcodes() // 恢复这行
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
  // useEffect(() => {
  //   fetchTodayCount()
  //   fetchHighestRecord()
  //
  //   const dataTimer = setInterval(() => {
  //     fetchTodayCount()
  //     fetchHighestRecord()
  //   }, 30000)
  //
  //   return () => clearInterval(dataTimer)
  // }, [])

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
              // onClick={handleTodayCountClick} // 移除点击功能
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-red-400 via-pink-500 to-rose-400 bg-clip-text text-transparent mb-2">
                今日总数
              </h2>
              <div className="text-6xl md:text-8xl lg:text-9xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                {todayCount}
              </div>
            </div>

            {/* 最佳记录 */}
            <div className="relative flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 backdrop-blur-md border-2 border-yellow-400/50 shadow-2xl hover:shadow-yellow-400/30 transition-all duration-300">
              {/* 背景光晕效果 */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-300/10 via-orange-300/10 to-red-300/10 blur-xl"></div>
              
              <div className="relative z-10 w-full">
                {/* 标题部分 */}
                <div className="flex items-center justify-center mb-3">
                  <BarChart3 className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-yellow-300 mr-2 drop-shadow-2xl" />
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-black bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent drop-shadow-2xl">
                    🏆 Best Record
                  </h2>
                </div>
                
                {/* 内容区域 */}
                <div className="space-y-3">
                  {/* 日期部分 */}
                  <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-yellow-300/30">
                    <span className="text-base md:text-lg lg:text-xl font-bold text-yellow-200 drop-shadow-lg">
                      📅 Date:
                    </span>
                    <span className="text-lg md:text-xl lg:text-2xl font-black text-white drop-shadow-2xl bg-gradient-to-r from-white via-yellow-100 to-orange-100 bg-clip-text text-transparent">
                      {formatDisplayDate(highestRecord.date)}
                    </span>
                  </div>
                  
                  {/* 数字部分 - 最突出 */}
                  <div className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-400/20 backdrop-blur-sm border-2 border-yellow-300/50 shadow-xl">
                    <span className="text-base md:text-lg lg:text-xl font-bold text-yellow-200 drop-shadow-lg">
                      🪟 Windows/Day:
                    </span>
                    <span className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent drop-shadow-2xl transform hover:scale-105 transition-transform duration-300 leading-none">
                      {highestRecord.count}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 时间和日期 */}
            <div className="flex flex-col justify-center space-y-4">
              <div className="text-center">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent mb-2 flex items-center justify-center">
                  <Calendar className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-emerald-400 mr-2" />
                  Today&apos;s Date
                </h3>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1">
                  {currentDate ? formatDate(currentDate) : '--'}
                </div>
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-emerald-300">
                  {currentTime ? formatTime(currentTime) : '--:--:--'}
                </div>
              </div>
              {connectionError && (
                <div className="flex items-center mt-2">
                  <WifiOff className="w-6 h-6 md:w-8 md:h-8 text-red-400 mr-1" />
                  <span className="text-base md:text-lg text-red-400">连接中断</span>
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
                  <h3 className="text-2xl md:text-3xl font-bold">今日扫描条码列表</h3>
                  <p className="text-lg md:text-xl text-blue-100 mt-1">
                    {currentDate ? formatDate(currentDate) : new Date().toLocaleDateString('en-CA')}
                  </p>
                </div>
                <button
                  onClick={() => setShowTodayModal(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-8 h-8 md:w-10 md:h-10" />
                </button>
              </div>
              
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {loadingBarcodes ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500 text-xl md:text-2xl">加载今日数据中...</div>
                  </div>
                ) : todayBarcodes.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-lg md:text-xl text-gray-600 mb-4 bg-blue-50 p-2 rounded">
                      今日共扫描 <span className="font-bold text-blue-600">{todayBarcodes.length}</span> 个条码
                    </div>
                    {todayBarcodes.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-4">
                          <span className="text-lg md:text-xl text-gray-500 w-8">
                            {index + 1}
                          </span>
                          <span className="font-mono bg-yellow-200 px-2 py-1 rounded text-lg md:text-xl font-semibold">
                            {item.barcode}
                          </span>
                          {item.device_port && (
                            <span className="text-base md:text-lg text-gray-500 bg-gray-200 px-2 py-1 rounded">
                              端口: {item.device_port}
                            </span>
                          )}
                          <span className="text-base md:text-lg text-green-600 bg-green-100 px-2 py-1 rounded">
                            {item.status}
                          </span>
                        </div>
                        <div className="text-lg md:text-xl text-gray-600">
                          {formatDateTime(item.scannedAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-2 text-xl md:text-2xl">今日暂无扫描记录</div>
                    <div className="text-lg md:text-xl text-gray-400">
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
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col lg:flex-row">
        {/* Left Section - Today's Count - 统一蓝色背景 */}
        <div className="flex-1 lg:flex-[7] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 shadow-2xl h-full">
          <div 
            className="text-center p-4 lg:p-8 rounded-3xl bg-white/8 backdrop-blur-md border border-white/15 shadow-2xl max-w-4xl mx-auto cursor-pointer hover:bg-white/12 transition-all duration-300"
            onClick={handleTodayCountClick}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold bg-gradient-to-r from-red-400 via-pink-500 to-rose-400 bg-clip-text text-transparent mb-4 lg:mb-6 drop-shadow-lg leading-tight">
              Total Windows Today
            </h1>
            <div className="text-[8rem] sm:text-[10rem] md:text-[12rem] lg:text-[16rem] xl:text-[20rem] font-bold bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 bg-clip-text text-transparent leading-none drop-shadow-2xl">
              {todayCount}
            </div>
          </div>
        </div>

        {/* Right Section - Records and Time - 统一蓝色背景 */}
        <div className="flex-1 lg:flex-[5] flex flex-col justify-center p-3 lg:p-6 space-y-3 lg:space-y-4 h-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
          {/* Best Record Section - 增大其他文字字体 */}
          <div className="relative flex flex-col items-center justify-center text-center p-3 lg:p-4 rounded-3xl bg-gradient-to-br from-amber-500/30 via-yellow-500/30 to-orange-500/30 backdrop-blur-lg border-2 border-amber-400/60 shadow-2xl hover:shadow-amber-400/40 transition-all duration-300 flex-[4] overflow-hidden">
            {/* 多层背景光晕效果 */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-400/20 via-yellow-400/20 to-orange-400/20 blur-2xl"></div>
            <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-yellow-300/10 via-amber-300/10 to-orange-300/10 blur-xl"></div>
            
            <div className="relative z-10 w-full h-full flex flex-col justify-between py-2">
              {/* 标题部分 - 显著增大字体 */}
              <div className="flex items-center justify-center">
                <div className="flex items-center bg-gradient-to-r from-amber-400/20 to-yellow-400/20 backdrop-blur-sm rounded-2xl px-4 py-3 border border-amber-300/40">
                  <BarChart3 className="w-12 h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 text-amber-300 mr-3 drop-shadow-lg" />
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-300 bg-clip-text text-transparent drop-shadow-lg">
                    🏆 Best Record
                  </h2>
                </div>
              </div>
              
              {/* 日期部分 - 显著增大字体 */}
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center mb-2">
                  <span className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-amber-200 drop-shadow-lg">
                    📅 {formatDisplayDate(highestRecord.date)}
                  </span>
                </div>
              </div>
              
              {/* Windows数字部分 - 超大显眼 */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-amber-200 drop-shadow-lg mb-3">
                    🪟 Windows/Day
                  </div>
                  {/* 超大数字 */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 blur-2xl opacity-50 rounded-full"></div>
                    <span className="relative text-8xl sm:text-9xl lg:text-[8rem] xl:text-[10rem] 2xl:text-[12rem] font-black bg-gradient-to-br from-yellow-200 via-amber-200 to-orange-200 bg-clip-text text-transparent drop-shadow-2xl leading-none tracking-tight transform hover:scale-110 transition-transform duration-500 cursor-pointer">
                      {highestRecord.count}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 装饰性边框 */}
            <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-amber-300/60 rounded-tl-lg"></div>
            <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-amber-300/60 rounded-tr-lg"></div>
            <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-amber-300/60 rounded-bl-lg"></div>
            <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-amber-300/60 rounded-br-lg"></div>
          </div>
          
          {/* Combined Date & Time Section - 与左侧完全一致的背景风格 */}
          <div className="text-center p-4 lg:p-6 rounded-3xl bg-white/8 backdrop-blur-md border border-white/15 shadow-2xl hover:bg-white/12 transition-all duration-300 flex-[2]">
            <div className="flex items-center justify-center mb-3 lg:mb-4">
              <Calendar className="w-8 h-8 lg:w-10 lg:h-10 text-emerald-400 mr-2 lg:mr-3 drop-shadow-lg" />
              <Clock className="w-8 h-8 lg:w-10 lg:h-10 text-blue-400 mr-2 lg:mr-3 drop-shadow-lg" />
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Today&apos;s Date & Time
              </h3>
            </div>
            
            {/* 日期显示 */}
            <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white drop-shadow-lg mb-2 lg:mb-3">
              {currentDate ? formatDate(currentDate) : '--'}
            </div>
            
            {/* 时间显示 */}
            <div className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-emerald-300 drop-shadow-lg font-mono mb-3 lg:mb-4">
              {currentTime ? formatTime(currentTime) : '--:--:--'}
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center justify-center">
              {connectionError ? (
                <>
                  <WifiOff className="w-6 h-6 lg:w-8 lg:h-8 text-red-400 mr-2" />
                  <span className="text-lg lg:text-xl text-red-400 font-semibold">连接中断</span>
                </>
              ) : (
                <>
                  <Wifi className="w-6 h-6 lg:w-8 lg:h-8 text-green-400 mr-2" />
                  <span className="text-lg lg:text-xl text-green-400 font-semibold">连接正常</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}