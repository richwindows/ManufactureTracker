'use client'

import { useState, useEffect } from 'react'
import { Search, Package, Calendar, Upload, Monitor, Users, LogOut, Settings } from 'lucide-react'
import ProductList from '@/components/ProductList'
import ProductListByStatus from '@/components/ProductListByStatus'
import BulkImport from '@/components/BulkImport'
import StatusStats from '@/components/StatusStats'
import ProductStatusSync from '@/components/ProductStatusSync'
import UserManagement from '@/components/UserManagement'
import ProtectedRoute, { AdminOnly, OperatorAndAbove, PermissionGuard } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { PERMISSIONS } from '@/lib/auth'

function Home() {
  const { user, logout, hasPermission, isAdmin } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [dateStats, setDateStats] = useState([])
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [viewMode, setViewMode] = useState('status') // 'list' 或 'status' - 默认按状态分组

  useEffect(() => {
    fetchProducts()
    fetchDateStats()
  }, [selectedDate])

  const fetchDateStats = async () => {
    try {
      const response = await fetch('/api/products/stats')
      if (response.ok) {
        const data = await response.json()
        setDateStats(data.recentDates)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const params = selectedDate ? `?date=${selectedDate}` : ''
      const response = await fetch(`/api/products${params}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
    setLoading(true)
  }



  const handleProductDelete = async (id) => {
    if (confirm('确定要删除这个产品吗？')) {
      try {
        const response = await fetch(`/api/products?id=${id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          fetchProducts()
        }
      } catch (error) {
        console.error('Error deleting product:', error)
      }
    }
  }

  // 搜索过滤
  const filteredProducts = products.filter(product =>
    product.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* 页面标题栏 */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-cyan-400 mr-3 drop-shadow-lg" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">产品管理系统</h1>
                <p className="text-sm text-cyan-200/80">产品状态跟踪和管理</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* 用户信息 */}
              {user && (
                <div className="flex items-center space-x-3 text-white/90">
                  <div className="text-right">
                    <div className="text-sm font-medium">{user.full_name}</div>
                    <div className="text-xs text-white/70">
                      {user.role === 'admin' && '管理员'}
                      {user.role === 'operator' && '操作员'}
                      {user.role === 'viewer' && '查看者'}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 导航按钮 */}
              <PermissionGuard requiredPermissions={[PERMISSIONS.BARCODES_VIEW]}>
                <a
                  href="/barcode-collector"
                  className="group bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Package className="h-4 w-4 text-purple-400 group-hover:text-purple-300" />
                  <span className="font-medium">Counting Windows</span>
                </a>
              </PermissionGuard>
              
              {/* 功能按钮组 */}
              <div className="flex items-center space-x-3">
                <PermissionGuard requiredPermissions={[PERMISSIONS.PRODUCTS_BULK_IMPORT]}>
                  <button
                    onClick={() => setShowBulkImport(true)}
                    className="group bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Upload className="h-4 w-4 text-emerald-400 group-hover:text-emerald-300" />
                    <span className="font-medium">批量导入</span>
                  </button>
                </PermissionGuard>
                
                <AdminOnly>
                  <button
                    onClick={() => setShowUserManagement(true)}
                    className="group bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Users className="h-4 w-4 text-orange-400 group-hover:text-orange-300" />
                    <span className="font-medium">用户管理</span>
                  </button>
                </AdminOnly>
                
                <button
                  onClick={logout}
                  className="group bg-gradient-to-r from-gray-500/20 to-slate-500/20 hover:from-gray-500/30 hover:to-slate-500/30 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <LogOut className="h-4 w-4 text-gray-400 group-hover:text-gray-300" />
                  <span className="font-medium">退出</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 用户管理界面 */}
        {showUserManagement ? (
          <AdminOnly>
            <div className="bg-white rounded-2xl shadow-xl border border-white/20">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">用户管理</h2>
                  <button
                    onClick={() => setShowUserManagement(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    返回主页
                  </button>
                </div>
              </div>
              <UserManagement />
            </div>
          </AdminOnly>
        ) : (
          <>
            {/* 状态统计 */}
            <PermissionGuard requiredPermissions={[PERMISSIONS.REPORTS_VIEW]}>
              <StatusStats key={products.length} />
            </PermissionGuard>
            
            {/* 产品状态自动同步 */}
            <OperatorAndAbove>
              <div className="mb-8">
                <ProductStatusSync />
              </div>
            </OperatorAndAbove>

        {/* 搜索和筛选框 */}
        <div className="bg-white/12 backdrop-blur-md rounded-2xl shadow-xl mb-8 p-6 border border-white/20">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 h-4 w-4" />
              <input
                type="text"
                placeholder="搜索产品（客户名、产品ID、样式、条码）..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 backdrop-blur-sm transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* 日期选择器 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="bg-white/10 border border-white/30 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 backdrop-blur-sm transition-all duration-300"
                />
              </div>
              
              {/* 今天按钮 */}
              <button
                onClick={() => handleDateChange('')}
                className="px-4 py-2 bg-white/15 border border-white/30 rounded-xl text-white hover:bg-white/25 transition-all duration-300 backdrop-blur-sm font-medium"
              >
                今天
              </button>
            </div>
          </div>

          {/* 最近有数据的日期快速选择 */}
          {dateStats.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center mb-2">
                <span className="text-sm text-white/80 font-medium">最近有数据的日期：</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dateStats.slice(0, 10).map((stat) => (
                  <button
                    key={stat.date}
                    onClick={() => handleDateChange(stat.date)}
                    className={`px-3 py-1 text-sm rounded-full transition-all duration-300 backdrop-blur-sm ${
                      selectedDate === stat.date
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                        : 'bg-white/15 text-white/90 hover:bg-white/25 border border-white/30'
                    }`}
                  >
                    {stat.date} ({stat.count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 视图切换 */}
          <div className="mt-4 pt-4 border-t border-white/20">
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

            {/* 产品列表 */}
            <PermissionGuard requiredPermissions={[PERMISSIONS.PRODUCTS_VIEW]}>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">加载中...</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow">
                  {viewMode === 'status' ? (
                    <ProductListByStatus 
                      products={filteredProducts} 
                      onDelete={handleProductDelete} 
                    />
                  ) : (
                    <ProductList 
                      products={filteredProducts} 
                      onDelete={handleProductDelete} 
                    />
                  )}
                </div>
              )}
            </PermissionGuard>
          </>
        )}
      </main>



      {/* 批量导入弹窗 */}
      {showBulkImport && (
        <PermissionGuard requiredPermissions={[PERMISSIONS.PRODUCTS_BULK_IMPORT]}>
          <BulkImport
            onImportComplete={() => {
              setShowBulkImport(false)
              fetchProducts()
            }}
            onClose={() => setShowBulkImport(false)}
          />
        </PermissionGuard>
      )}
    </div>
  )
}

// 使用权限保护包装整个页面
function ProtectedHome() {
  return (
    <ProtectedRoute>
      <Home />
    </ProtectedRoute>
  )
}

export default ProtectedHome
