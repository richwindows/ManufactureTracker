'use client'

import { useState, useEffect } from 'react'
import { Package, Clock, CheckCircle, AlertCircle, RefreshCw, Search, Calendar } from 'lucide-react'
import ModulePermissionGuard from './ModulePermissionGuard'

export default function StatusStatsHeader({ 
  searchTerm, 
  setSearchTerm, 
  dateRange, 
  handleDateRangeChange, 
  products,
  viewMode,
  setViewMode
}) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // 添加状态来记住搜索前的时间范围
  const [previousDateRange, setPreviousDateRange] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [dateRange]) // 当dateRange变化时重新获取统计数据

  // 组件初始化时，如果没有设置日期范围，则设置为本周
  useEffect(() => {
    if (!dateRange.startDate && !dateRange.endDate) {
      const thisWeekRange = getThisWeekRange()
      handleDateRangeChange(thisWeekRange)
    }
  }, [])

  // 处理搜索输入变化的函数
  const handleSearchChange = (e) => {
    const searchValue = e.target.value
    const previousSearchTerm = searchTerm
    setSearchTerm(searchValue)
    
    // 如果从无搜索变为有搜索（开始搜索）
    if (!previousSearchTerm.trim() && searchValue.trim()) {
      // 保存当前的时间范围
      if (dateRange.startDate || dateRange.endDate) {
        setPreviousDateRange({ ...dateRange })
        // 清除时间筛选
        handleDateRangeChange({ startDate: '', endDate: '' })
      }
    }
    // 如果从有搜索变为无搜索（清空搜索）
    else if (previousSearchTerm.trim() && !searchValue.trim()) {
      // 恢复之前的时间范围
      if (previousDateRange) {
        handleDateRangeChange(previousDateRange)
        setPreviousDateRange(null)
      }
    }
  }

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 构建查询参数，包含时间范围
      const params = new URLSearchParams()
      if (dateRange?.startDate) {
        params.append('startDate', dateRange.startDate)
      }
      if (dateRange?.endDate) {
        params.append('endDate', dateRange.endDate)
      }
      
      const url = `/api/products/status-stats${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // 确保数据结构正确，只包含新状态
      const safeStats = {
        total: data.total || 0,
        todayScanned: data.todayScanned || 0,
        byStatus: {
          scheduled: 0,
          '已切割': 0,
          '已清角': 0,
          '已入库': 0,
          '部分出库': 0,
          '已出库': 0,
          ...data.byStatus
        }
      }
      
      setStats(safeStats)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError(error.message)
      
      // 设置默认的安全数据
      setStats({
        total: 0,
        todayScanned: 0,
        byStatus: {
          scheduled: 0,
          '已切割': 0,
          '已清角': 0,
          '已入库': 0,
          '部分出库': 0,
          '已出库': 0
        }
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取今天的日期范围
  const getTodayRange = () => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    return { startDate: todayStr, endDate: todayStr }
  }

  // 获取本周的日期范围
  const getThisWeekRange = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)) // 周一开始
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // 周日结束
    
    return {
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: endOfWeek.toISOString().split('T')[0]
    }
  }

  // 获取本月的日期范围
  const getThisMonthRange = () => {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    return {
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0]
    }
  }

  // 快速日期选择处理函数
  const handleQuickDateSelect = (type) => {
    let newRange
    switch (type) {
      case 'today':
        newRange = getTodayRange()
        break
      case 'thisWeek':
        newRange = getThisWeekRange()
        break
      case 'thisMonth':
        newRange = getThisMonthRange()
        break
      case 'all':
        newRange = { startDate: '', endDate: '' }
        break
      default:
        return
    }
    handleDateRangeChange(newRange)
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl mb-8 p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-20 bg-white/20 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 确保 stats 存在且有正确的结构
  if (!stats || !stats.byStatus) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl mb-8 p-6 border border-white/20">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-white/60 mx-auto mb-4" />
            <p className="text-white/80 mb-4">
              {error ? `加载失败: ${error}` : '无法加载统计数据'}
            </p>
            <button
              onClick={fetchStats}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 mx-auto transition-all duration-300 backdrop-blur-sm border border-white/30"
            >
              <RefreshCw className="h-4 w-4" />
              重试
            </button>
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: '已排产',
      value: (stats.byStatus?.scheduled || 0),
      icon: Package,
      color: 'text-blue-300',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-400/30'
    },
    {
      title: '已切割',
      value: (stats.byStatus?.['已切割'] || 0),
      icon: Package,
      color: 'text-purple-300',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-400/30'
    },
    {
      title: '已清角',
      value: (stats.byStatus?.['已清角'] || 0),
      icon: Clock,
      color: 'text-orange-300',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-400/30'
    },
    {
      title: '已入库',
      value: (stats.byStatus?.['已入库'] || 0),
      icon: CheckCircle,
      color: 'text-green-300',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-400/30'
    },
    {
      title: '部分出库',
      value: (stats.byStatus?.['部分出库'] || 0),
      icon: Package,
      color: 'text-yellow-300',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-400/30'
    },
    {
      title: '已出库',
      value: (stats.byStatus?.['已出库'] || 0),
      icon: CheckCircle,
      color: 'text-emerald-300',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-400/30'
    }
  ]

  // 按状态分组产品（用于下方的详细统计）
  const groupedProducts = products ? products.reduce((acc, product) => {
    const status = product.status || 'scheduled'
    if (!acc[status]) {
      acc[status] = []
    }
    acc[status].push(product)
    return acc
  }, {}) : {}

  // 按生产流程顺序排列状态
  const statusOrder = ['scheduled', '已切割', '已清角', '已入库', '部分出库', '已出库']
  const sortedStatuses = statusOrder.filter(status => groupedProducts[status])

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl mb-8 p-6 border border-white/20">
      {/* 搜索和筛选框 - 移除权限检查，始终显示 */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* 搜索框 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 h-4 w-4" />
            <input
              type="text"
              placeholder="搜索产品（客户名、产品ID、样式、条码）..."
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 backdrop-blur-sm transition-all duration-300"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {/* 添加搜索提示 */}
            {searchTerm && (dateRange.startDate || dateRange.endDate) && (
              <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-cyan-500/20 border border-cyan-400/30 rounded-lg text-xs text-cyan-200 backdrop-blur-sm">
                搜索时将清除时间筛选，针对所有数据搜索
              </div>
            )}
          </div>
          
          {/* 日期范围选择器 */}
          <ModulePermissionGuard moduleName="date_filter">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              {/* 日期范围输入 */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange({ ...dateRange, startDate: e.target.value })}
                  className="bg-white/10 border border-white/30 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 backdrop-blur-sm transition-all duration-300"
                  disabled={searchTerm.trim() !== ''}
                />
                <span className="text-white/60">至</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange({ ...dateRange, endDate: e.target.value })}
                  className="bg-white/10 border border-white/30 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 backdrop-blur-sm transition-all duration-300"
                  disabled={searchTerm.trim() !== ''}
                />
              </div>
              
              {/* 快捷选择按钮 */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDateRangeChange(getTodayRange())}
                  disabled={searchTerm.trim() !== ''}
                  className={`px-3 py-2 bg-white/15 border border-white/30 rounded-xl text-white hover:bg-white/25 transition-all duration-300 backdrop-blur-sm font-medium text-sm ${
                    searchTerm.trim() !== '' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  今天
                </button>
                <button
                  onClick={() => handleDateRangeChange(getThisWeekRange())}
                  disabled={searchTerm.trim() !== ''}
                  className={`px-3 py-2 bg-white/15 border border-white/30 rounded-xl text-white hover:bg-white/25 transition-all duration-300 backdrop-blur-sm font-medium text-sm ${
                    searchTerm.trim() !== '' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  本周
                </button>
                <button
                  onClick={() => handleDateRangeChange(getThisMonthRange())}
                  disabled={searchTerm.trim() !== ''}
                  className={`px-3 py-2 bg-white/15 border border-white/30 rounded-xl text-white hover:bg-white/25 transition-all duration-300 backdrop-blur-sm font-medium text-sm ${
                    searchTerm.trim() !== '' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  本月
                </button>
                <button
                  onClick={() => handleDateRangeChange({ startDate: '', endDate: '' })}
                  className="px-3 py-2 bg-white/15 border border-white/30 rounded-xl text-white hover:bg-white/25 transition-all duration-300 backdrop-blur-sm font-medium text-sm"
                >
                  全部
                </button>
              </div>
            </div>
          </ModulePermissionGuard>
        </div>

        {/* 视图切换 */}
        <div className="pt-4 border-t border-white/20">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-white/80 font-medium">视图模式：</span>
            <div className="flex bg-white/10 rounded-xl p-1 backdrop-blur-sm border border-white/20">
              <button
                onClick={() => setViewMode('status')}
                className={`px-3 py-1 text-sm rounded-lg transition-all duration-300 ${
                  viewMode === 'status'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                    : 'text-white/80 hover:text-white hover:bg-white/15'
                }`}
              >
                按状态分组
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded-lg transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                    : 'text-white/80 hover:text-white hover:bg-white/15'
                }`}
              >
                列表视图
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* 删除这行: </ModulePermissionGuard> */}
  
      {/* 标题和刷新按钮 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          生产进度总览
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-white/80">
            今日扫描: {stats.todayScanned || 0} 个
          </div>
          {products && (
            <div className="text-sm text-white/80">
              总计 {products.length} 个产品，分布在 {sortedStatuses.length} 个状态中
            </div>
          )}
          {error && (
            <div className="flex items-center text-orange-300 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              数据可能不是最新的
            </div>
          )}
          <button
            onClick={fetchStats}
            className="text-white/60 hover:text-white/90 transition-colors p-2 rounded-lg hover:bg-white/10"
            title="刷新数据"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className={`${card.bgColor} ${card.borderColor} rounded-xl p-4 border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg`}
          >
            <div className="flex flex-col items-center text-center">
              <card.icon className={`h-6 w-6 ${card.color} mb-2`} />
              <p className="text-sm font-medium text-white/90 mb-1">{card.title}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
