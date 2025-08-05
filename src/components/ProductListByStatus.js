'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Eye, Trash2, Package, Calendar, X, Edit, Check, XCircle } from 'lucide-react'

export default function ProductListByStatus({ products, scannedOnlyBarcodes = [], onDelete, onStatusUpdate }) {
  const [expandedStatuses, setExpandedStatuses] = useState({})
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editingStatus, setEditingStatus] = useState(null)
  const [newStatus, setNewStatus] = useState('')

  const statusOptions = [
    'scheduled',
    '已切割',
    '已清角', 
    '已入库',
    '部分出库',
    '已出库'
  ]

  // 合并产品数据和仅扫码数据，按状态分组
  const groupByStatus = () => {
    const groups = {}
    
    // 处理产品数据
    products.forEach(product => {
      const status = product.status || 'scheduled'
      if (!groups[status]) {
        groups[status] = { products: [], scannedOnly: [] }
      }
      groups[status].products.push(product)
    })
    
    // 处理仅扫码数据
    scannedOnlyBarcodes.forEach(barcode => {
      const status = barcode.status || '已扫描'
      if (!groups[status]) {
        groups[status] = { products: [], scannedOnly: [] }
      }
      groups[status].scannedOnly.push(barcode)
    })
    
    return groups
  }

  const statusGroups = groupByStatus()

  // 定义状态显示顺序和名称
  const statusOrder = ['scheduled', '已切割', '已清角', '已入库', '部分出库', '已出库', '已扫描']
  const statusNames = {
    'scheduled': '已排产',
    '已切割': '已切割',
    '已清角': '已清角',
    '已入库': '已入库',
    '部分出库': '部分出库',
    '已出库': '已出库',
    '已扫描': '已扫描'
  }

  const toggleStatus = (status) => {
    setExpandedStatuses(prev => ({
      ...prev,
      [status]: !prev[status]
    }))
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case '已切割':
        return 'bg-yellow-100 text-yellow-800'
      case '已清角':
        return 'bg-orange-100 text-orange-800'
      case '已入库':
        return 'bg-green-100 text-green-800'
      case '部分出库':
        return 'bg-purple-100 text-purple-800'
      case '已出库':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusName = (status) => {
    return status === 'scheduled' ? '已排产' : status
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

  const handleStatusEdit = (productId, currentStatus) => {
    setEditingStatus(productId)
    setNewStatus(currentStatus)
  }

  const handleStatusSave = async (productId) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setEditingStatus(null)
        setNewStatus('')
        if (onStatusUpdate) {
          onStatusUpdate()
        }
      } else {
        console.error('更新状态失败')
      }
    } catch (error) {
      console.error('更新状态时出错:', error)
    }
  }

  const handleStatusCancel = () => {
    setEditingStatus(null)
    setNewStatus('')
  }

  // 检查是否有数据
  const hasData = Object.keys(statusGroups).some(status => 
    statusGroups[status].products.length > 0 || statusGroups[status].scannedOnly.length > 0
  )

  if (!hasData) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>没有找到产品数据</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {statusOrder.map(status => {
        const group = statusGroups[status]
        if (!group || (group.products.length === 0 && group.scannedOnly.length === 0)) return null
        
        const totalCount = group.products.length + group.scannedOnly.length
        const isExpanded = expandedStatuses[status]
        
        return (
          <div key={status} className="border border-gray-200 rounded-lg overflow-hidden">
            <div 
              className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleStatus(status)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="font-medium text-gray-900">
                    {statusNames[status]}
                    ({totalCount} 条记录)
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  {isExpanded ? '收起' : '展开'}
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品信息</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">规格</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">条码</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* 渲染产品数据 */}
                    {group.products.map((product) => (
                      <tr key={`product-${product.id}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">产品</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.productId}</div>
                          <div className="text-sm text-gray-500">{product.style}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.size} | {product.frame} | {product.glass}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingStatus === product.id ? (
                            <div className="flex items-center space-x-2">
                              <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                              >
                                {statusOptions.map(option => (
                                  <option key={option} value={option}>
                                    {option === 'scheduled' ? '已排产' : option}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleStatusSave(product.id)}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingStatus(null)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(product.status)}`}>
                                {getStatusName(product.status)}
                              </span>
                              <button
                                onClick={() => handleStatusEdit(product.id, product.status)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{product.barcode}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(product.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDelete(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    
                    {/* 渲染仅扫码数据 */}
                    {group.scannedOnly.map((barcode) => (
                      <tr key={`barcode-${barcode.id}`} className="hover:bg-gray-50 bg-blue-50/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">仅扫码</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {barcode.status || '已扫描'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{barcode.barcode_data}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(barcode.scan_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className="text-gray-400">-</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}

      {/* 产品详情弹窗 */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">产品详情</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">客户名称</label>
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
                <label className="block text-sm font-medium text-gray-700">条码</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{selectedProduct.barcode}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">状态</label>
                <p className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedProduct.status)}`}>
                    {getStatusName(selectedProduct.status)}
                  </span>
                </p>
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
      )}
    </div>
  )
}