'use client'

import { useState } from 'react'
import { Trash2, Eye, Calendar, Package, X, CheckCircle, Clock, Scan } from 'lucide-react'

export default function ProductList({ products, onDelete }) {
  const [selectedProduct, setSelectedProduct] = useState(null)

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getStatusBadge = (status, scannedAt) => {
    const statusConfig = {
      'scheduled': { name: '已排产', color: 'bg-purple-100 text-purple-800', icon: Package },
      '开料': { name: '开料', color: 'bg-orange-100 text-orange-800', icon: Package },
      '焊接': { name: '焊接', color: 'bg-red-100 text-red-800', icon: Package },
      '清角': { name: '清角', color: 'bg-yellow-100 text-yellow-800', icon: Package },
      '组装': { name: '组装', color: 'bg-blue-100 text-blue-800', icon: Package },
      '入库': { name: '入库', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      '出库': { name: '出库', color: 'bg-purple-100 text-purple-800', icon: CheckCircle }
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

  if (products.length === 0) {
    return (
      <div className="p-8 text-center">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">暂无产品数据</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
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
                  {getStatusBadge(product.status, product.scannedAt)}
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
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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