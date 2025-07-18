'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Clock, Scan, CheckCircle, Package, AlertCircle, RefreshCw } from 'lucide-react'

export default function StatusStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/products/status-stats')
      
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 确保 stats 存在且有正确的结构
  if (!stats || !stats.byStatus) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {error ? `加载失败: ${error}` : '无法加载统计数据'}
            </p>
            <button
              onClick={fetchStats}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mx-auto"
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
      title: '总产品',
      value: stats.total || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: '已排产',
      value: (stats.byStatus?.scheduled || 0),
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: '生产中',
      value: (stats.byStatus?.['已切割'] || 0) + 
             (stats.byStatus?.['已清角'] || 0),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: '已完成',
      value: (stats.byStatus?.['已入库'] || 0) + 
             (stats.byStatus?.['部分出库'] || 0) +
             (stats.byStatus?.['已出库'] || 0),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ]

  // 安全地计算进度
  const totalProduction = (stats.byStatus?.['已切割'] || 0) + 
                          (stats.byStatus?.['已清角'] || 0) + 
                          (stats.byStatus?.['已入库'] || 0) + 
                          (stats.byStatus?.['部分出库'] || 0) +
                          (stats.byStatus?.['已出库'] || 0)
  
  const totalCompleted = (stats.byStatus?.['已入库'] || 0) + 
                         (stats.byStatus?.['部分出库'] || 0) +
                         (stats.byStatus?.['已出库'] || 0)
  
  const progress = stats.total > 0 ? {
    production: Math.round((totalProduction / stats.total) * 100),
    completed: Math.round((totalCompleted / stats.total) * 100)
  } : { production: 0, completed: 0 }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">状态统计</h2>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-sm text-gray-500">
            今日扫描: {stats.todayScanned || 0} 个
          </div>
          {error && (
            <div className="flex items-center text-orange-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              数据可能不是最新的
            </div>
          )}
          <button
            onClick={fetchStats}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="刷新数据"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, index) => (
          <div key={index} className={`${card.bgColor} rounded-lg p-4`}>
            <div className="flex items-center">
              <card.icon className={`h-6 w-6 ${card.color} mr-3`} />
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 进度条 */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>生产进度</span>
            <span>{progress.production}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.production}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>完成进度</span>
            <span>{progress.completed}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.completed}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 详细状态信息 */}
      {stats.total > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div>已排产: {stats.byStatus?.scheduled || 0}</div>
              <div>已切割: {stats.byStatus?.['已切割'] || 0}</div>
              <div>已清角: {stats.byStatus?.['已清角'] || 0}</div>
              <div>已入库: {stats.byStatus?.['已入库'] || 0}</div>
              <div>部分出库: {stats.byStatus?.['部分出库'] || 0}</div>
              <div>已出库: {stats.byStatus?.['已出库'] || 0}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 