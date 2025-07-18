'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Package, Calendar, Upload } from 'lucide-react'
import ProductForm from '@/components/ProductForm'
import ProductList from '@/components/ProductList'
import ProductListByStatus from '@/components/ProductListByStatus'
import BulkImport from '@/components/BulkImport'
import StatusStats from '@/components/StatusStats'

export default function Home() {
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [dateStats, setDateStats] = useState([])
  const [showBulkImport, setShowBulkImport] = useState(false)
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

  const handleProductAdd = (newProduct) => {
    // 重新获取数据以确保日期筛选正确
    fetchProducts()
    setShowForm(false)
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
    <div className="min-h-screen bg-gray-50">
      {/* 页面标题栏 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">产品管理系统</h1>
                <p className="text-sm text-gray-600">产品状态跟踪和管理</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/barcode-collector"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Package className="h-4 w-4" />
                条码收集器
              </a>
              <button
                onClick={() => setShowBulkImport(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Upload className="h-4 w-4" />
                批量导入
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                添加产品
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 状态统计 */}
        <StatusStats key={products.length} />

        {/* 搜索和筛选框 */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="搜索产品（客户名、产品ID、样式、条码）..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* 日期选择器 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* 今天按钮 */}
              <button
                onClick={() => handleDateChange('')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                今天
              </button>
            </div>
          </div>

          {/* 最近有数据的日期快速选择 */}
          {dateStats.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center mb-2">
                <span className="text-sm text-gray-600">最近有数据的日期：</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dateStats.slice(0, 10).map((stat) => (
                  <button
                    key={stat.date}
                    onClick={() => handleDateChange(stat.date)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedDate === stat.date
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {stat.date} ({stat.count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 视图切换 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">视图模式：</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('status')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    viewMode === 'status'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  按状态分组
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  列表视图
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 产品列表 */}
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
      </main>

      {/* 添加产品表单弹窗 */}
      {showForm && (
        <ProductForm
          onSubmit={handleProductAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* 批量导入弹窗 */}
      {showBulkImport && (
        <BulkImport
          onSuccess={() => {
            setShowBulkImport(false)
            fetchProducts()
          }}
          onCancel={() => setShowBulkImport(false)}
        />
      )}
    </div>
  )
}
