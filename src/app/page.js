'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Package, Barcode, Calendar, Upload } from 'lucide-react'
import ProductForm from '@/components/ProductForm'
import ProductList from '@/components/ProductList'
import ProductListByStatus from '@/components/ProductListByStatus'
import BarcodeScanner from '@/components/BarcodeScanner'
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
  const [viewMode, setViewMode] = useState('list') // 'list' 或 'status'

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

  const handleProductDelete = (deletedId) => {
    setProducts(products.filter(p => p.id !== deletedId))
  }

  const filteredProducts = products.filter(product =>
    product.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">产品管理系统</h1>
            </div>
            <div className="flex space-x-3">
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

        {/* 扫码枪输入区域 */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex items-center mb-4">
            <Barcode className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">扫码枪输入</h2>
          </div>
          <BarcodeScanner onProductAdd={handleProductAdd} />
        </div>

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
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
              >
                今天
              </button>
              <button
                onClick={() => handleDateChange('')}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                全部
              </button>
            </div>
          </div>
          
          {/* 日期显示提示和快速选择 */}
          <div className="mt-4 space-y-3">
            <div className="text-sm text-gray-600">
              {selectedDate ? (
                <span>显示 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('zh-CN')} 的数据</span>
              ) : (
                <span>显示所有数据</span>
              )}
            </div>
            
            {/* 最近有数据的日期快速选择 */}
            {dateStats.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">最近有数据的日期：</p>
                <div className="flex flex-wrap gap-2">
                  {dateStats.slice(0, 10).map(({ date, count }) => (
                    <button
                      key={date}
                      onClick={() => handleDateChange(date)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        selectedDate === date
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {new Date(date + 'T00:00:00').toLocaleDateString('zh-CN', { 
                        month: 'short', 
                        day: 'numeric' 
                      })} ({count})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 产品列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                产品列表 ({filteredProducts.length})
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  列表视图
                </button>
                <button
                  onClick={() => setViewMode('status')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    viewMode === 'status'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  状态分组
                </button>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">加载中...</p>
            </div>
          ) : viewMode === 'list' ? (
            <ProductList products={filteredProducts} onDelete={handleProductDelete} />
          ) : (
            <div className="p-6">
              <ProductListByStatus products={filteredProducts} onDelete={handleProductDelete} />
            </div>
          )}
        </div>
      </main>

      {/* 产品表单模态框 */}
      {showForm && (
        <ProductForm
          onClose={() => setShowForm(false)}
          onSubmit={handleProductAdd}
        />
      )}

      {/* 批量导入模态框 */}
      {showBulkImport && (
        <BulkImport
          onClose={() => setShowBulkImport(false)}
          onImportComplete={handleProductAdd}
        />
      )}
    </div>
  )
}
