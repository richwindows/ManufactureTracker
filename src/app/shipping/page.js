'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Search, Package, Truck, LogOut, CheckCircle } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { PERMISSIONS } from '@/lib/auth'

function ShippingPage() {
  const { user, logout, hasPermission } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // 搜索产品
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setMessage('请输入搜索关键词')
      return
    }

    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.products || [])
        if (data.products.length === 0) {
          setMessage('未找到匹配的产品')
        }
      } else {
        setMessage('搜索失败，请重试')
      }
    } catch (error) {
      console.error('搜索错误:', error)
      setMessage('搜索出错，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理出货操作
  const handleShipping = async (productId, shippingType) => {
    try {
      const newStatus = shippingType === 'full' ? '已出库' : '部分出库'
      
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

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
      } else {
        setMessage('更新失败，请重试')
      }
    } catch (error) {
      console.error('更新状态错误:', error)
      setMessage('操作失败，请重试')
    }
  }

  // 获取状态显示样式
  const getStatusBadge = (status) => {
    const statusConfig = {
      'scheduled': { name: '已排产', color: 'bg-purple-100 text-purple-800', icon: '📋' },
      '已切割': { name: '已切割', color: 'bg-orange-100 text-orange-800', icon: '✂️' },
      '已清角': { name: '已清角', color: 'bg-yellow-100 text-yellow-800', icon: '✨' },
      '已入库': { name: '已入库', color: 'bg-green-100 text-green-800', icon: '📦' },
      '部分出库': { name: '部分出库', color: 'bg-blue-100 text-blue-800', icon: '📤' },
      '已出库': { name: '已出库', color: 'bg-purple-100 text-purple-800', icon: '🚚' },
    }

    const config = statusConfig[status] || { name: status, color: 'bg-gray-100 text-gray-800', icon: '❓' }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.name}
      </span>
    )
  }

  // 检查权限
  if (!hasPermission(PERMISSIONS.PRODUCTS_SHIPPING)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600">您没有权限访问出货管理系统</p>
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
                  <div className="text-sm font-medium text-gray-900">{user.full_name || user.username}</div>
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
        {!loading && searchResults.length === 0 && searchTerm && (
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

// 使用权限保护包装页面
function ProtectedShippingPage() {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.PRODUCTS_SHIPPING]}>
      <ShippingPage />
    </ProtectedRoute>
  )
}

export default ProtectedShippingPage