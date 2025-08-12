'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProductListByStatus from '@/components/ProductListByStatus'
import MobileProductList from '@/components/MobileProductList'
import BulkImport from '@/components/BulkImport'
import UserManagement from '@/components/UserManagement'
import StatusStatsHeader from '@/components/StatusStatsHeader'
import ProtectedRoute from '@/components/ProtectedRoute'
import ModulePermissionGuard, { MODULE_PERMISSIONS } from '@/components/ModulePermissionGuard'
import { Package, Upload, Users, LogOut, Search, RefreshCw } from 'lucide-react'

function Home() {
  const { user, logout } = useAuth()
  const [products, setProducts] = useState([])
  const [scannedOnlyBarcodes, setScannedOnlyBarcodes] = useState([])
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

  useEffect(() => {
    fetchProducts()
    fetchScannedOnlyBarcodes()
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

  const fetchScannedOnlyBarcodes = async () => {
    try {
      console.log('Fetching scanned-only barcodes...')
      const response = await fetch('/api/barcodes/scanned-only')
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Scanned-only barcodes data:', data)
        setScannedOnlyBarcodes(data)
      } else {
        const errorText = await response.text()
        console.error('API error:', errorText)
      }
    } catch (error) {
      console.error('Error fetching scanned-only barcodes:', error)
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

  // 添加刷新函数
  const handleRefresh = () => {
    setLoading(true)
    fetchProducts()
    fetchScannedOnlyBarcodes()
  }

  // 统一状态更新函数名
  const handleStatusUpdate = async (productId, newStatus) => {
    try {
      console.log('Updating product status:', { productId, newStatus })
      
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      })
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Update successful:', result)
        
        // 添加成功提示
        alert(`✅ 状态更新成功！\n产品已更新为：${newStatus}`)
        
        fetchProducts() // 刷新产品数据
        fetchScannedOnlyBarcodes() // 同时刷新仅扫码数据
      } else {
        const errorData = await response.json()
        console.error('Failed to update product status:', errorData)
        alert(`❌ 更新状态失败: ${errorData.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('Error updating product status:', error)
      alert(`❌ 网络错误: ${error.message}`)
    }
  }

  // 搜索过滤 - 同时过滤产品和仅扫码数据
  const filteredProducts = products.filter(product =>
    product.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.style?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredScannedOnlyBarcodes = scannedOnlyBarcodes.filter(barcode =>
    barcode.barcode_data?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 统一的界面（所有角色）
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
                    <div className="text-sm font-medium">{user.username}</div>
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
              <ModulePermissionGuard modulePermission={MODULE_PERMISSIONS.COUNTING_WINDOWS}>
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
                <ModulePermissionGuard modulePermission={MODULE_PERMISSIONS.BULK_IMPORT}>
                  <button
                    onClick={() => setShowBulkImport(true)}
                    className="group bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Upload className="h-4 w-4 text-emerald-400 group-hover:text-emerald-300" />
                    <span className="font-medium">批量导入</span>
                  </button>
                </ModulePermissionGuard>
                
                <ModulePermissionGuard modulePermission={MODULE_PERMISSIONS.USER_MANAGEMENT}>
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
          <ModulePermissionGuard modulePermission={MODULE_PERMISSIONS.USER_MANAGEMENT}>
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
            <ModulePermissionGuard modulePermission={MODULE_PERMISSIONS.STATUS_STATS}>
              <StatusStatsHeader 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                dateRange={dateRange}
                handleDateRangeChange={handleDateRangeChange}
                products={filteredProducts}
              />
            </ModulePermissionGuard>

            {/* 产品列表 - 只显示状态分组视图 */}
            <ModulePermissionGuard 
              modulePermission={MODULE_PERMISSIONS.PRODUCT_LIST}
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
                  {/* 根据用户角色条件渲染不同的组件 */}
                  {user?.role === 'shipping_receiving' ? (
                    <MobileProductList 
                      products={filteredProducts}
                      onStatusUpdate={handleStatusUpdate}
                      onRefresh={handleRefresh}
                    />
                  ) : (
                    <ProductListByStatus 
                      products={filteredProducts} 
                      scannedOnlyBarcodes={filteredScannedOnlyBarcodes}
                      onDelete={handleProductDelete}
                      onStatusUpdate={handleStatusUpdate}
                      onRefresh={handleRefresh}
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
        <ModulePermissionGuard modulePermission={MODULE_PERMISSIONS.BULK_IMPORT}>
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
