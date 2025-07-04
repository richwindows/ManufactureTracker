'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Eye, Trash2, Package, Calendar, X } from 'lucide-react'

export default function ProductListByStatus({ products, onDelete }) {
  const [expandedStatuses, setExpandedStatuses] = useState({})
  const [selectedProduct, setSelectedProduct] = useState(null)

  const statusConfig = {
    'scheduled': { name: '已排产', color: 'bg-purple-100 text-purple-800', icon: '📋' },
    'pending': { name: '待处理', color: 'bg-gray-100 text-gray-800', icon: '⏳' },
    '开料': { name: '开料', color: 'bg-orange-100 text-orange-800', icon: '🔧' },
    '焊接': { name: '焊接', color: 'bg-red-100 text-red-800', icon: '🔥' },
    '清角': { name: '清角', color: 'bg-yellow-100 text-yellow-800', icon: '✨' },
    '组装': { name: '组装', color: 'bg-blue-100 text-blue-800', icon: '🔩' },
    '入库': { name: '入库', color: 'bg-green-100 text-green-800', icon: '📦' },
    '出库': { name: '出库', color: 'bg-purple-100 text-purple-800', icon: '🚚' },
    'scanned': { name: '已扫描', color: 'bg-cyan-100 text-cyan-800', icon: '📱' }
  }

  // 按状态分组产品
  const groupedProducts = products.reduce((acc, product) => {
    const status = product.status || 'scheduled'
    if (!acc[status]) {
      acc[status] = []
    }
    acc[status].push(product)
    return acc
  }, {})

  const toggleStatusExpansion = (status) => {
    setExpandedStatuses(prev => ({
      ...prev,
      [status]: !prev[status]
    }))
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const handleDelete = async (productId) => {
    if (window.confirm('确定要删除这个产品吗？')) {
      try {
        const response = await fetch(`/api/products/${productId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          onDelete(productId)
        }
      } catch (error) {
        console.error('删除产品失败:', error)
      }
    }
  }

  if (Object.keys(groupedProducts).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>没有找到产品数据</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedProducts).map(([status, statusProducts]) => {
        const config = statusConfig[status] || { name: status, color: 'bg-gray-100 text-gray-800', icon: '❓' }
        const isExpanded = expandedStatuses[status]

        return (
          <div key={status} className="bg-white rounded-lg shadow border">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleStatusExpansion(status)}
            >
              <div className="flex items-center">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-400 mr-2" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400 mr-2" />
                )}
                <span className="text-lg mr-2">{config.icon}</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                  {config.name}
                </span>
                <span className="ml-3 text-sm text-gray-500">
                  ({statusProducts.length} 个产品)
                </span>
              </div>
              <div className="text-sm text-gray-400">
                {isExpanded ? '收起' : '展开'}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          客户
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          产品信息
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          规格
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          条码
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          时间
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {statusProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.customer}</div>
                            <div className="text-sm text-gray-500">批次: {product.batchNo}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {product.productId} - {product.style}
                            </div>
                            <div className="text-sm text-gray-500">P.O: {product.po || '无'}</div>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(product.createdAt)}
                            </div>
                            {product.scannedAt && (
                              <div className="text-xs text-blue-600">
                                扫描: {formatDate(product.scannedAt)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => setSelectedProduct(product)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )
      })}

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
            <div className="p-6">
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
                  <p className="mt-1 text-sm text-gray-900">{selectedProduct.po || '无'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">批次号</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProduct.batchNo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">条码</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProduct.barcode || '无'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">状态</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    statusConfig[selectedProduct.status]?.color || 'bg-gray-100 text-gray-800'
                  }`}>
                    {statusConfig[selectedProduct.status]?.name || selectedProduct.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">创建时间</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedProduct.createdAt)}</p>
                </div>
                {selectedProduct.scannedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">扫描时间</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedProduct.scannedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 