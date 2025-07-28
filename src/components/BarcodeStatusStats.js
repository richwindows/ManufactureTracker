'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Package, Scan, TrendingUp, Clock, CheckCircle } from 'lucide-react'

export default function BarcodeStatusStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/barcodes/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch barcode stats')
      }
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching barcode stats:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white/12 backdrop-blur-md rounded-2xl shadow-xl mb-8 p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4 w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/20 backdrop-blur-md rounded-2xl shadow-xl mb-8 p-6 border border-red-500/30">
        <div className="flex items-center text-red-300">
          <Package className="h-5 w-5 mr-2" />
          <span>加载条码统计失败: {error}</span>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const getStatusColor = (status) => {
    switch (status) {
      case 'cut':
      case '已切割': return 'from-blue-500 to-cyan-500'
      case 'corner_cleaned':
      case '已清角': return 'from-yellow-500 to-orange-500'
      case 'stored':
      case '已入库': return 'from-green-500 to-emerald-500'
      case '部分出库': return 'from-purple-500 to-pink-500'
      case '已出库': return 'from-gray-500 to-slate-500'
      case 'scheduled': return 'from-indigo-500 to-blue-500'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  const getStageColor = (stage) => {
    switch (stage) {
      case 'cut':
      case '已切割': return 'from-blue-500 to-cyan-500'
      case 'corner_cleaned':
      case '已清角': return 'from-yellow-500 to-orange-500'
      case 'stored':
      case '已入库': return 'from-green-500 to-emerald-500'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  const getStatusDisplayName = (status) => {
    switch (status) {
      case 'cut': return '已切割'
      case 'corner_cleaned': return '已清角'
      case 'stored': return '已入库'
      case 'no_status': return '未设置状态'
      case 'unknown': return '未知状态'
      default: return status
    }
  }

  const getStageDisplayName = (stage) => {
    switch (stage) {
      case 'cut': return '已切割'
      case 'corner_cleaned': return '已清角'
      case 'stored': return '已入库'
      case 'unknown': return '未知阶段'
      default: return stage
    }
  }

  const getScanStatusDisplayName = (status) => {
    switch (status) {
      case 'scanned': return '已扫描'
      case 'not_scanned': return '未扫描'
      default: return status
    }
  }

  return (
    <div className="bg-white/12 backdrop-blur-md rounded-2xl shadow-xl mb-8 p-6 border border-white/20">
      {/* 标题 */}
      <div className="flex items-center mb-6">
        <Scan className="h-6 w-6 text-cyan-400 mr-3" />
        <h2 className="text-xl font-bold text-white">条码扫描状态统计</h2>
        <div className="ml-auto text-sm text-cyan-200/80">
          基于产品表状态关联
        </div>
      </div>

      {/* 总体统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-200/80 text-sm font-medium">总扫描次数</p>
              <p className="text-2xl font-bold text-white">{stats.totalScans}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-cyan-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl p-4 border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-200/80 text-sm font-medium">今日扫描</p>
              <p className="text-2xl font-bold text-white">{stats.todayScans}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200/80 text-sm font-medium">已扫描产品</p>
              <p className="text-2xl font-bold text-white">{stats.scannedProducts}</p>
              <p className="text-xs text-purple-200/60">共{stats.totalProducts}个产品</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-200/80 text-sm font-medium">未扫描产品</p>
              <p className="text-2xl font-bold text-white">{stats.unscannedProducts}</p>
              <p className="text-xs text-orange-200/60">待扫描</p>
            </div>
            <Clock className="h-8 w-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* 产品扫描状态概览 */}
      <div className="mb-6 bg-white/8 rounded-xl p-4 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Package className="h-5 w-5 text-cyan-400 mr-2" />
          产品扫描状态概览
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {Object.entries(stats.productScanStatus).map(([status, count]) => {
             const isScanned = status === 'scanned'
             const colorClass = isScanned ? 'from-green-500 to-emerald-500' : 'from-red-500 to-orange-500'
             const percentage = stats.totalProducts > 0 ? ((count / stats.totalProducts) * 100).toFixed(1) : 0
             
             return (
               <div key={status} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                 <div className="flex items-center">
                   <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${colorClass} mr-3`}></div>
                   <span className="text-white/90">{getScanStatusDisplayName(status)}</span>
                 </div>
                 <div className="text-right">
                   <span className="text-white font-semibold text-lg">{count}</span>
                   <span className="text-white/60 text-sm ml-2">({percentage}%)</span>
                 </div>
               </div>
             )
           })}
        </div>
      </div>

      {/* 详细统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 按产品状态统计 */}
        <div className="bg-white/8 rounded-xl p-4 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Package className="h-5 w-5 text-cyan-400 mr-2" />
            产品状态分布
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getStatusColor(status)} mr-3`}></div>
                  <span className="text-white/90 text-sm">{getStatusDisplayName(status)}</span>
                </div>
                <span className="text-white font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 按扫描阶段统计 */}
        <div className="bg-white/8 rounded-xl p-4 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Scan className="h-5 w-5 text-emerald-400 mr-2" />
            扫描阶段分布
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.stageCounts).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getStageColor(stage)} mr-3`}></div>
                  <span className="text-white/90 text-sm">{getStageDisplayName(stage)}</span>
                </div>
                <span className="text-white font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 按设备统计 */}
        <div className="bg-white/8 rounded-xl p-4 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 text-purple-400 mr-2" />
            设备扫描分布
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.deviceCounts).map(([device, count]) => (
              <div key={device} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mr-3"></div>
                  <span className="text-white/90 text-sm">{device}</span>
                </div>
                <span className="text-white font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 产品扫描详情 */}
      {stats.scannedProductDetails && stats.scannedProductDetails.length > 0 && (
        <div className="mt-6 bg-white/8 rounded-xl p-4 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Package className="h-5 w-5 text-cyan-400 mr-2" />
            产品扫描详情
            <span className="ml-auto text-sm text-cyan-200/80">
              显示前20个产品
            </span>
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stats.scannedProductDetails.slice(0, 20).map((product, index) => (
              <div key={index} className={`flex items-center justify-between py-3 px-4 rounded-lg ${
                product.isScanned ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    product.isScanned ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-white/90 text-sm font-mono">{product.barcode}</span>
                  {product.isScanned && (
                    <>
                       <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">
                         {getStatusDisplayName(product.status)}
                       </span>
                       <span className="text-xs text-white/60 bg-blue-500/20 px-2 py-1 rounded">
                         扫描{product.scanCount}次
                       </span>
                     </>
                  )}
                </div>
                <div className="text-xs text-white/60">
                  {product.isScanned ? '已扫描' : '未扫描'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最近扫描记录 */}
      {stats.recentScans.length > 0 && (
        <div className="mt-6 bg-white/8 rounded-xl p-4 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Clock className="h-5 w-5 text-orange-400 mr-2" />
            最近扫描记录
          </h3>
          <div className="space-y-2">
            {stats.recentScans.slice(0, 5).map((scan, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getStatusColor(scan.product_status)}`}></div>
                  <span className="text-white/90 text-sm font-mono">{scan.clean_barcode}</span>
                  <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">{getStatusDisplayName(scan.product_status)}</span>
                </div>
                <div className="text-xs text-white/60">
                  {new Date(scan.scanned_at).toLocaleString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}