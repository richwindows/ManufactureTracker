'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PERMISSIONS } from '@/lib/permissions'
import ProtectedRoute from '@/components/ProtectedRoute'
import { 
  Search, 
  Package, 
  Truck, 
  LogOut, 
  CheckCircle,
  BarChart3,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react'

function ShippingPage() {
  const { user, logout, hasPermission, permissions } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [productStats, setProductStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // 调试信息
  useEffect(() => {
    console.log('Shipping页面调试信息:', {
      user,
      permissions,
      hasShippingPermission: hasPermission(PERMISSIONS.PRODUCTS_SHIPPING),
      requiredPermission: PERMISSIONS.PRODUCTS_SHIPPING
    })
  }, [user, permissions, hasPermission])

  // 获取生产进度统计
  useEffect(() => {
    fetchProductStats()
  }, [])

  const fetchProductStats = async () => {
    try {
      setStatsLoading(true)
      const response = await fetch('/api/products/status-stats')
      const data = await response.json()
      setProductStats(data)
    } catch (error) {
      console.error('获取生产统计失败:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setMessage('请输入搜索关键词')
      return
    }

    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()
      
      if (response.ok) {
        setSearchResults(data.products || [])
        setMessage(data.products?.length > 0 ? `找到 ${data.products.length} 个产品` : '未找到匹配的产品')
      } else {
        setMessage(data.error || '搜索失败')
        setSearchResults([])
      }
    } catch (error) {
      console.error('搜索出错:', error)
      setMessage('搜索出错，请重试')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleShipping = async (productId, type) => {
    try {
      const newStatus = type === 'partial' ? '部分出库' : '已出库'
      
      const response = await fetch(`/api/products?id=${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage(`产品状态已更新为：${newStatus}`)
        // 更新搜索结果中的产品状态
        setSearchResults(prev => 
          prev.map(product => 
            product.id === productId 
              ? { ...product, status: newStatus }
              : product
          )
        )
        // 刷新统计数据
        fetchProductStats()
      } else {
        setMessage(data.error || '更新失败')
      }
    } catch (error) {
      console.error('更新产品状态出错:', error)
      setMessage('更新失败，请重试')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'scheduled': { name: '已排产', color: 'bg-purple-100 text-purple-800', icon: '📋' },
      '已切割': { name: '已切割', color: 'bg-orange-100 text-orange-800', icon: '✂️' },
      '已清角': { name: '已清角', color: 'bg-yellow-100 text-yellow-800', icon: '🔧' },
      '已入库': { name: '已入库', color: 'bg-blue-100 text-blue-800', icon: '📦' },
      '部分出库': { name: '部分出库', color: 'bg-indigo-100 text-indigo-800', icon: '📤' },
      '已出库': { name: '已出库', color: 'bg-green-100 text-green-800', icon: '✅' }
    }
    
    const config = statusConfig[status] || { name: status, color: 'bg-gray-100 text-gray-800', icon: '❓' }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.name}
      </span>
    )
  }

  // 更宽松的权限检查 - 允许多种角色访问
  const canAccessShipping = () => {
    // 管理员总是可以访问
    if (user?.role === 'admin') {
      return true
    }
    
    // 检查是否有出货权限
    if (hasPermission(PERMISSIONS.PRODUCTS_SHIPPING)) {
      return true
    }
    
    // 检查是否是 shipping_receiving 角色
    if (user?.role === 'shipping_receiving') {
      return true
    }
    
    // 检查是否有产品查看和更新权限（基本的出货需求）
    if (hasPermission(PERMISSIONS.PRODUCTS_VIEW) && hasPermission(PERMISSIONS.PRODUCTS_UPDATE)) {
      return true
    }
    
    return false
  }

  // 如果用户未登录，显示加载状态
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在验证用户权限...</p>
        </div>
      </div>
    )
  }

  // 权限检查
  if (!canAccessShipping()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600">您没有权限访问出货管理系统</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>当前用户: {user?.username}</p>
            <p>用户角色: {user?.role}</p>
            <p>权限列表: {permissions.join(', ') || '无'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">出货管理系统</h1>
                <p className="text-sm text-gray-600">Shipping & Receiving</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{user.fullName || user.username}</div>
                  <div className="text-xs text-gray-600">出货管理员</div>
                </div>
              )}
              
              <button
                onClick={logout}
                className="group bg-gradient-to-r from-gray-500/20 to-slate-500/20 hover:from-gray-500/30 hover:to-slate-500/30 text-gray-700 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-medium">退出</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 生产进度总览 */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl mb-8 p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">生产进度总览</h2>
            </div>
            <button
              onClick={fetchProductStats}
              disabled={statsLoading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {statsLoading ? '刷新中...' : '刷新数据'}
            </button>
          </div>

          {statsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : productStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {/* 总计 */}
              <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">总产品数</p>
                    <p className="text-2xl font-bold text-blue-900">{productStats.total}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              {/* 各状态统计 */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-200">
                <div className="text-center">
                  <div className="text-lg mb-1">📋</div>
                  <div className="text-2xl font-bold text-purple-900">{productStats.byStatus.scheduled}</div>
                  <div className="text-xs text-purple-700">已排产</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-4 border border-orange-200">
                <div className="text-center">
                  <div className="text-lg mb-1">✂️</div>
                  <div className="text-2xl font-bold text-orange-900">{productStats.byStatus['已切割']}</div>
                  <div className="text-xs text-orange-700">已切割</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-200">
                <div className="text-center">
                  <div className="text-lg mb-1">🔧</div>
                  <div className="text-2xl font-bold text-yellow-900">{productStats.byStatus['已清角']}</div>
                  <div className="text-xs text-yellow-700">已清角</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-200">
                <div className="text-center">
                  <div className="text-lg mb-1">📦</div>
                  <div className="text-2xl font-bold text-blue-900">{productStats.byStatus['已入库']}</div>
                  <div className="text-xs text-blue-700">已入库</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-4 border border-indigo-200">
                <div className="text-center">
                  <div className="text-lg mb-1">📤</div>
                  <div className="text-2xl font-bold text-indigo-900">{productStats.byStatus['部分出库']}</div>
                  <div className="text-xs text-indigo-700">部分出库</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-200">
                <div className="text-center">
                  <div className="text-lg mb-1">✅</div>
                  <div className="text-2xl font-bold text-green-900">{productStats.byStatus['已出库']}</div>
                  <div className="text-xs text-green-700">已出库</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>无法加载生产进度数据</p>
            </div>
          )}
        </div>

        {/* 搜索区域 */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl mb-8 p-6 border border-white/20">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-5 w-5" />
              <input
                type="text"
                placeholder="搜索产品（客户名、产品ID、样式、条码）..."
                className="w-full pl-10 pr-4 py-3 bg-white/60 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? '搜索中...' : '搜索'}
            </button>
          </div>
          
          {message && (
            <div className={`mt-4 p-3 rounded-lg ${
              message.includes('失败') || message.includes('出错') || message.includes('未找到')
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-green-100 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* 搜索结果 */}
        {searchResults.length > 0 && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">搜索结果 ({searchResults.length})</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      产品信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      客户
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      规格
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      条码
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      当前状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      出货操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 divide-y divide-gray-200">
                  {searchResults.map((product) => (
                    <tr key={product.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.productId} - {product.style}
                        </div>
                        <div className="text-sm text-gray-500">P.O: {product.po || '无'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.customer}</div>
                        <div className="text-sm text-gray-500">批次: {product.batchNo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{product.size}</div>
                        <div>{product.frame} | {product.glass}</div>
                        {product.grid && <div>Grid: {product.grid}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                          {product.barcode || '无'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(product.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {product.status !== '已出库' && (
                          <>
                            <button
                              onClick={() => handleShipping(product.id, 'partial')}
                              className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                            >
                              <Package className="h-3 w-3 mr-1" />
                              部分出库
                            </button>
                            <button
                              onClick={() => handleShipping(product.id, 'full')}
                              className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              完全出库
                            </button>
                          </>
                        )}
                        {product.status === '已出库' && (
                          <span className="text-gray-500 text-xs">已完成出库</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!loading && searchResults.length === 0 && !searchTerm && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">请输入搜索关键词查找产品</p>
            <p className="text-gray-400 text-sm mt-2">支持搜索客户名、产品ID、样式或条码</p>
          </div>
        )}
      </main>
    </div>
  )
}

// 使用权限保护包装页面 - 移除严格的权限检查
function ProtectedShippingPage() {
  return (
    <ProtectedRoute>
      <ShippingPage />
    </ProtectedRoute>
  )
}

export default ProtectedShippingPage