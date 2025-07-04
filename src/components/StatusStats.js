'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Clock, Scan, CheckCircle, Package } from 'lucide-react'

export default function StatusStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/products/status-stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
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

  if (!stats) {
    return null
  }

  const statCards = [
    {
      title: '总产品',
      value: stats.total,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: '已排产',
      value: stats.byStatus.scheduled || 0,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: '生产中',
      value: (stats.byStatus['开料'] || 0) + (stats.byStatus['焊接'] || 0) + (stats.byStatus['清角'] || 0) + (stats.byStatus['组装'] || 0),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: '已入库',
      value: (stats.byStatus['入库'] || 0) + (stats.byStatus['出库'] || 0),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ]

  // 计算进度
  const totalProduction = (stats.byStatus['开料'] || 0) + (stats.byStatus['焊接'] || 0) + (stats.byStatus['清角'] || 0) + (stats.byStatus['组装'] || 0) + (stats.byStatus['入库'] || 0) + (stats.byStatus['出库'] || 0)
  const totalCompleted = (stats.byStatus['入库'] || 0) + (stats.byStatus['出库'] || 0)
  
  const progress = stats.total > 0 ? {
    production: Math.round((totalProduction / stats.total) * 100),
    completed: Math.round((totalCompleted / stats.total) * 100)
  } : { production: 0, completed: 0 }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">状态统计</h2>
        <div className="ml-auto text-sm text-gray-500">
          今日扫描: {stats.todayScanned} 个
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
    </div>
  )
} 