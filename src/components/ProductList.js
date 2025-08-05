'use client'

import { useState, useEffect } from 'react'
import { Trash2, Eye, Calendar, Package, X, CheckCircle, Clock, Scan, Edit3, Save, XCircle, AlertTriangle } from 'lucide-react'

export default function ProductList({ products, onDelete, onStatusUpdate }) {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editingStatus, setEditingStatus] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [scannedOnlyBarcodes, setScannedOnlyBarcodes] = useState([])
  const [showScannedOnly, setShowScannedOnly] = useState(true)

  const statusOptions = [
    'scheduled',
    '已切割',
    '已清角', 
    '已入库',
    '部分出库',
    '已出库'
  ]

  // 获取只有扫码数据但没有产品数据的条码
  useEffect(() => {
    fetchScannedOnlyBarcodes()
  }, [])

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

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个产品吗？')) {
      try {
        const response = await fetch(`/api/products?id=${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          onDelete(id)
          alert('产品删除成功！')
        } else {
          alert('删除失败，请重试')
        }
      } catch (error) {
        console.error('Error:', error)
        alert('删除失败，请重试')
      }
    }
  }

  const handleStatusEdit = (product) => {
    setEditingStatus(product.id)
    setNewStatus(product.status || 'scheduled')
  }

  const handleStatusSave = async (productId) => {
    try {
      const response = await fetch(`/api/products?id=${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        setEditingStatus(null)
        setNewStatus('')
        if (onStatusUpdate) {
          onStatusUpdate(updatedProduct)
        }
        alert('状态更新成功！')
      } else {
        alert('状态更新失败，请重试')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('状态更新失败，请重试')
    }
  }

  const handleStatusCancel = () => {
    setEditingStatus(null)
    setNewStatus('')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getStatusBadge = (status, scannedAt) => {
    const statusConfig = {
      'scheduled': { name: '已排产', color: 'bg-purple-100 text-purple-800', icon: Package },
      '已切割': { name: '已切割', color: 'bg-orange-100 text-orange-800', icon: Package },
      '已清角': { name: '已清角', color: 'bg-yellow-100 text-yellow-800', icon: Package },
      '已入库': { name: '已入库', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      '部分出库': { name: '部分出库', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      '已出库': { name: '已出库', color: 'bg-purple-100 text-purple-800', icon: CheckCircle }
    }

    const config = statusConfig[status] || { name: status || '未知', color: 'bg-gray-100 text-gray-800', icon: Package }
    const IconComponent = config.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.name}
      </span>
    )
  }

  const getStatusName = (status) => {
    const statusConfig = {
      'scheduled': '已排产',
      '已切割': '已切割',
      '已清角': '已清角',
      '已入库': '已入库',
      '部分出库': '部分出库',
      '已出库': '已出库'
    }
    return statusConfig[status] || status || '未知'
  }

  if (products.length === 0 && scannedOnlyBarcodes.length === 0) {
    return (
      <div className="p-8 text-center">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">暂无产品数据</p>
      </div>
    )
  }

  return (
    <>
      {/* 切换显示选项 */}
      <div className="mb-4 flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showScannedOnly}
            onChange={(e) => setShowScannedOnly(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">
            显示仅有扫码数据的条码 ({scannedOnlyBarcodes.length} 条)
          </span>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                类型
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                客户
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                产品ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                样式
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                尺寸
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                框架
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                玻璃
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                条码
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                创建时间
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* 显示产品数据 */}
            {products.map((product) => (
              <tr key={`product-${product.id}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Package className="h-3 w-3 mr-1" />
                    产品数据
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.customer}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.productId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.style}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.size}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.frame}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.glass}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                    {product.barcode || '无'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingStatus === product.id ? (
                    <div className="flex items-center space-x-2">
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {getStatusName(status)}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleStatusSave(product.id)}
                        className="text-green-600 hover:text-green-900"
                        title="保存"
                      >
                        <Save className="h-3 w-3" />
                      </button>
                      <button
                        onClick={handleStatusCancel}
                        className="text-red-600 hover:text-red-900"
                        title="取消"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(product.status, product.scannedAt)}
                      <button
                        onClick={() => handleStatusEdit(product)}
                        className="text-blue-600 hover:text-blue-900 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="编辑状态"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(product.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="text-blue-600 hover:text-blue-900"
                      title="查看详情"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleStatusEdit(product)}
                      className="text-green-600 hover:text-green-900"
                      title="编辑状态"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* 显示仅有扫码数据的条码 */}
            {showScannedOnly && scannedOnlyBarcodes.map((barcode) => (
              <tr key={`barcode-${barcode.id}`} className="hover:bg-yellow-50 bg-yellow-25">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    仅扫码数据
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="bg-yellow-100 px-2 py-1 rounded text-xs font-mono text-yellow-800">
                    {barcode.barcode_data}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    <Scan className="h-3 w-3 mr-1" />
                    {barcode.status || '已扫描'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(barcode.scan_time)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                      需要创建产品数据
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 产品详情模态框 */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">产品详情</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">客户</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProduct.customer}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">产品ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProduct.productId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">样式</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProduct.style}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">尺寸</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProduct.size}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">框架</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProduct.frame}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">玻璃</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProduct.glass}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">网格</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProduct.grid || '无'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">P.O</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProduct.po}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">批次号</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProduct.batchNo}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">条码</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                    {selectedProduct.barcode || '无'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">创建时间</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedProduct.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">更新时间</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedProduct.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}