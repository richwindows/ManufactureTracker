'use client'

import { useState, useEffect } from 'react'
import { Package, Upload, Users, LogOut } from 'lucide-react'
import ProductList from '@/components/ProductList'
import ProductListByStatus from '@/components/ProductListByStatus'
import BulkImport from '@/components/BulkImport'
import StatusStatsHeader from '@/components/StatusStatsHeader'
import UserManagement from '@/components/UserManagement'
import ProtectedRoute from '@/components/ProtectedRoute'
import ModulePermissionGuard from '@/components/ModulePermissionGuard'
import { useAuth } from '@/contexts/AuthContext'

function Home() {
  const { user, logout } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // 获取本周的日期范围作为默认值
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
  
  const [dateRange, setDateRange] = useState(getThisWeekRange()) // 设置默认值为本周
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [viewMode, setViewMode] = useState('status') // 'list' 或 'status' - 默认按状态分组

  useEffect(() => {
    fetchProducts()
  }, [dateRange])

  const fetchProducts = async () => {
    try {
      let params = ''
      if (dateRange.startDate && dateRange.endDate) {
        params = `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      } else if (dateRange.startDate) {
        params = `?startDate=${dateRange.startDate}`
      } else if (dateRange.endDate) {
        params = `?endDate=${dateRange.endDate}`
      }
      
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

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange)
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
    product.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.style?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                      {user.role === 'shipping_receiving' && '出货管理'}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 导航按钮 */}
              <ModulePermissionGuard moduleName="barcode_collector">
                <a
                  href="/barcode-collector"
                  className="group bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Package className="h-4 w-4 text-purple-400 group-hover:text-purple-300" />
                  <span className="font-medium">Counting Windows</span>
                </a>
              </ModulePermissionGuard>
              
              {/* 功能按钮组 */}
              <div className="flex items-center space-x-3">
                <ModulePermissionGuard moduleName="bulk_import">
                  <button
                    onClick={() => setShowBulkImport(true)}
                    className="group bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Upload className="h-4 w-4 text-emerald-400 group-hover:text-emerald-300" />
                    <span className="font-medium">批量导入</span>
                  </button>
                </ModulePermissionGuard>
                
                <ModulePermissionGuard moduleName="user_management">
                  <button
                    onClick={() => setShowUserManagement(true)}
                    className="group bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Users className="h-4 w-4 text-orange-400 group-hover:text-orange-300" />
                    <span className="font-medium">用户管理</span>
                  </button>
                </ModulePermissionGuard>
                
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
          <ModulePermissionGuard moduleName="user_management">
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
          </ModulePermissionGuard>
        ) : (
          <>
            {/* 生产进度总览 - 包含搜索、筛选和状态统计 */}
            <ModulePermissionGuard moduleName="product_stats">
              <StatusStatsHeader 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                dateRange={dateRange}
                handleDateRangeChange={handleDateRangeChange}
                products={filteredProducts}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
            </ModulePermissionGuard>

            {/* 产品列表 */}
            <ModulePermissionGuard 
              moduleName="product_list"
              fallback={
                <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-8">
                  <div className="text-center text-gray-500">
                    <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">产品列表访问受限</h3>
                    <p>管理员已限制您访问产品列表功能</p>
                  </div>
                </div>
              }
            >
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
                      onStatusUpdate={fetchProducts}
                    />
                  ) : (
                    <ProductList 
                      products={filteredProducts} 
                      onDelete={handleProductDelete} 
                    />
                  )}
                </div>
              )}
            </ModulePermissionGuard>
          </>
        )}
      </main>

      {/* 批量导入弹窗 */}
      {showBulkImport && (
        <ModulePermissionGuard moduleName="bulk_import">
          <BulkImport
            onImportComplete={() => {
              setShowBulkImport(false)
              fetchProducts()
            }}
            onClose={() => setShowBulkImport(false)}
          />
        </ModulePermissionGuard>
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
