'use client'

import { useState, useRef, useEffect } from 'react'
import { Scan, Plus, Search, CheckCircle, X } from 'lucide-react'

export default function BarcodeScanner({ onProductAdd }) {
  const [scannedCode, setScannedCode] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showMatching, setShowMatching] = useState(false)
  const [matchingProducts, setMatchingProducts] = useState([])
  const [currentBarcode, setCurrentBarcode] = useState('')
  const inputRef = useRef(null)
  const scanTimeoutRef = useRef(null)
  const [quickAddBarcode, setQuickAddBarcode] = useState('')

  // 自动聚焦到扫码输入框
  useEffect(() => {
    if (inputRef.current && isScanning) {
      inputRef.current.focus()
    }
  }, [isScanning])

  const handleScanInput = (e) => {
    const value = e.target.value
    setScannedCode(value)

    // 清除之前的超时
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
    }

    // 设置新的超时，如果500ms内没有新输入，认为扫描完成
    scanTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        handleScanComplete(value.trim())
      }
    }, 500)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && scannedCode.trim()) {
      e.preventDefault()
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current)
      }
      handleScanComplete(scannedCode.trim())
    }
  }

  const handleScanComplete = async (barcode) => {
    setScannedCode('')
    setIsScanning(false)
    
    try {
      // 检查是否已存在该条码的产品
      const response = await fetch(`/api/products`)
      const products = await response.json()
      
      // 首先检查条码是否已经被扫描过
      const scannedProduct = products.find(p => p.barcode === barcode && p.status !== 'pending')
      if (scannedProduct) {
        alert(`条码 ${barcode} 已被扫描！\n客户: ${scannedProduct.customer}\n产品ID: ${scannedProduct.productId}\n状态: ${getStatusText(scannedProduct.status)}`)
        return
      }
      
             // 查找所有可匹配的产品
       const matchingProducts = products.filter(p => !p.barcode || p.barcode === '')
      
             if (matchingProducts.length === 0) {
         alert('没有找到可匹配的产品，请先导入产品数据或该条码已被使用')
         return
       }
      
      // 显示匹配选择界面
      setMatchingProducts(matchingProducts)
      setCurrentBarcode(barcode)
      setShowMatching(true)
      
    } catch (error) {
      console.error('Error checking barcode:', error)
      alert('扫描失败，请重试')
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled': return '已排产'
      case 'pending': return '待扫描'
      case 'scanned': return '已扫描'
      case 'completed': return '已完成'
      default: return '未知'
    }
  }

  const startScanning = () => {
    setIsScanning(true)
    setScannedCode('')
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  const stopScanning = () => {
    setIsScanning(false)
    setScannedCode('')
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
    }
  }

  const handleProductMatch = async (productId, selectedStatus) => {
    try {
      const response = await fetch('/api/products/update-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId,
          barcode: currentBarcode,
          status: selectedStatus
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`扫描成功！\n产品: ${result.product.customer} - ${result.product.productId}\n状态: ${selectedStatus}`)
        setShowMatching(false)
        onProductAdd() // 刷新列表
      } else {
        alert('状态更新失败，请重试')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('状态更新失败，请重试')
    }
  }

  return (
    <div className="space-y-4">
      {/* 扫码控制区域 */}
      <div className="flex items-center space-x-4">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Scan className="h-4 w-4" />
            开始扫码
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            停止扫码
          </button>
        )}
        
        <div className="text-sm text-gray-600">
          {isScanning ? (
            <span className="text-green-600 flex items-center">
              <div className="animate-pulse w-2 h-2 bg-green-600 rounded-full mr-2"></div>
              等待扫码输入...
            </span>
          ) : (
            '点击"开始扫码"后使用扫码枪扫描条码'
          )}
        </div>
      </div>

      {/* 隐藏的输入框用于捕获扫码 */}
      <input
        ref={inputRef}
        type="text"
        value={scannedCode}
        onChange={handleScanInput}
        onBlur={() => inputRef.current?.focus()}
        className="opacity-0 h-0 w-0 pointer-events-none"
        autoComplete="off"
      />

      {/* 产品匹配选择界面 */}
      {showMatching && (
        <ProductMatching
          barcode={currentBarcode}
          products={matchingProducts}
          onMatch={handleProductMatch}
          onCancel={() => setShowMatching(false)}
          onAddNew={() => {
            setShowQuickAdd(true)
            setQuickAddBarcode(currentBarcode)
            setShowMatching(false)
          }}
        />
      )}

      {/* 快速添加表单 */}
      {showQuickAdd && (
        <QuickAddForm
          barcode={quickAddBarcode}
          onSuccess={() => {
            setShowQuickAdd(false)
            setQuickAddBarcode('')
            onProductAdd()
          }}
          onCancel={() => {
            setShowQuickAdd(false)
            setQuickAddBarcode('')
          }}
        />
      )}
    </div>
  )
}

// 产品匹配选择组件
function ProductMatching({ barcode, products, onMatch, onCancel, onAddNew }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('开料')

  const statusOptions = [
    { value: '开料', label: '开料', color: 'bg-orange-500', icon: '🔧' },
    { value: '焊接', label: '焊接', color: 'bg-red-500', icon: '🔥' },
    { value: '清角', label: '清角', color: 'bg-yellow-500', icon: '✨' },
    { value: '组装', label: '组装', color: 'bg-blue-500', icon: '🔩' },
    { value: '入库', label: '入库', color: 'bg-green-500', icon: '📦' },
    { value: '出库', label: '出库', color: 'bg-purple-500', icon: '🚚' }
  ]

  const filteredProducts = products.filter(product =>
    product.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.style.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleMatch = () => {
    if (selectedProduct) {
      onMatch(selectedProduct.id, selectedStatus)
    }
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Search className="h-5 w-5 text-orange-600 mr-2" />
          <h3 className="text-lg font-semibold text-orange-800">选择匹配的产品</h3>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-4 p-2 bg-orange-100 rounded border">
        <p className="text-sm text-orange-800">
          扫描到条码: <span className="font-mono font-bold">{barcode}</span>
        </p>
        <p className="text-xs text-orange-600 mt-1">
          请选择产品和要更新到的状态
        </p>
      </div>

      {/* 状态选择 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">选择状态</label>
        <div className="grid grid-cols-3 gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedStatus(option.value)}
              className={`p-2 border rounded-lg text-sm transition-colors ${
                selectedStatus === option.value
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 搜索框 */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="搜索产品（客户名、产品ID、样式）..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* 产品列表 */}
      <div className="max-h-60 overflow-y-auto mb-4">
        {filteredProducts.length > 0 ? (
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedProduct?.id === product.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {product.customer} - {product.productId}
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.style} | {product.size} | {product.frame}
                    </div>
                    <div className="text-xs text-gray-400">
                      P.O: {product.po} | 批次: {product.batchNo}
                    </div>
                  </div>
                  {selectedProduct?.id === product.id && (
                    <CheckCircle className="h-5 w-5 text-orange-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            没有找到匹配的产品
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-between">
        <button
          onClick={onAddNew}
          className="px-4 py-2 text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors"
        >
          添加新产品
        </button>
        <div className="space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleMatch}
            disabled={!selectedProduct}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            确认匹配到 {statusOptions.find(s => s.value === selectedStatus)?.icon} {selectedStatus}
          </button>
        </div>
      </div>
    </div>
  )
}

// 快速添加产品表单组件
function QuickAddForm({ barcode, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    customer: '',
    productId: '',
    style: '',
    size: '',
    frame: '',
    glass: '',
    grid: '',
    po: '',
    batchNo: '',
    barcode: barcode
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newProduct = await response.json()
        onSuccess(newProduct)
        alert('产品添加成功！')
        onCancel()
      } else {
        alert('添加失败，请重试')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('添加失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Plus className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-blue-800">快速添加产品</h3>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="mb-4 p-2 bg-blue-100 rounded border">
        <p className="text-sm text-blue-800">
          扫描到条码: <span className="font-mono font-bold">{barcode}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            name="customer"
            placeholder="客户 *"
            required
            value={formData.customer}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            name="productId"
            placeholder="产品ID *"
            required
            value={formData.productId}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            name="style"
            placeholder="样式 *"
            required
            value={formData.style}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            name="size"
            placeholder="尺寸 *"
            required
            value={formData.size}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            name="frame"
            placeholder="框架 *"
            required
            value={formData.frame}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            name="glass"
            placeholder="玻璃 *"
            required
            value={formData.glass}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            name="grid"
            placeholder="网格"
            value={formData.grid}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            name="po"
            placeholder="P.O *"
            required
            value={formData.po}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            name="batchNo"
            placeholder="批次号 *"
            required
            value={formData.batchNo}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '添加中...' : '添加产品'}
          </button>
        </div>
      </form>
    </div>
  )
} 