'use client'

import { useState } from 'react'
import { 
  ChevronDown, 
  ChevronRight, 
  Eye, 
  Trash2, 
  Package, 
  Calendar, 
  X, 
  Edit, 
  Check, 
  XCircle,
  Clock,
  Scissors,
  Square,
  Archive,
  TruckIcon,
  CheckCircle,
  Scan,
  Hash
} from 'lucide-react'

export default function ProductListByStatus({ products, scannedOnlyBarcodes = [], onDelete, onStatusUpdate, onRefresh }) {
  const [expandedStatuses, setExpandedStatuses] = useState({})
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editingStatus, setEditingStatus] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  // 添加扫码记录编辑相关状态
  const [editingBarcodeStatus, setEditingBarcodeStatus] = useState(null)
  const [newBarcodeStatus, setNewBarcodeStatus] = useState('')

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
    
    // 处理仅扫码数据 - 合并相同barcode_data的记录，保留最新状态
    const mergedBarcodes = {}
    
    // 首先按barcode_data分组，找到每个条码的最新记录
    scannedOnlyBarcodes.forEach(barcode => {
      const barcodeData = barcode.barcode_data
      
      if (!mergedBarcodes[barcodeData]) {
        mergedBarcodes[barcodeData] = barcode
      } else {
        // 比较时间，保留最新的记录
        const currentTime = new Date(barcode.last_scan_time || barcode.created_at)
        const existingTime = new Date(mergedBarcodes[barcodeData].last_scan_time || mergedBarcodes[barcodeData].created_at)
        
        if (currentTime > existingTime) {
          mergedBarcodes[barcodeData] = barcode
        }
      }
    })
    
    // 将合并后的条码数据按状态分组
    Object.values(mergedBarcodes).forEach(barcode => {
      const status = barcode.current_status || '已扫描'
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

  // 获取状态图标
  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-5 w-5 text-blue-600" />
      case '已切割':
        return <Scissors className="h-5 w-5 text-yellow-600" />
      case '已清角':
        return <Square className="h-5 w-5 text-orange-600" />
      case '已入库':
        return <Archive className="h-5 w-5 text-green-600" />
      case '部分出库':
        return <TruckIcon className="h-5 w-5 text-purple-600" />
      case '已出库':
        return <CheckCircle className="h-5 w-5 text-gray-600" />
      case '已扫描':
        return <Scan className="h-5 w-5 text-blue-600" />
      default:
        return <Package className="h-5 w-5 text-gray-600" />
    }
  }

  // 获取状态颜色主题
  const getStatusTheme = (status) => {
    switch (status) {
      case 'scheduled':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-900',
          badge: 'bg-blue-100 text-blue-800',
          hover: 'hover:bg-blue-100'
        }
      case '已切割':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-900',
          badge: 'bg-yellow-100 text-yellow-800',
          hover: 'hover:bg-yellow-100'
        }
      case '已清角':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-900',
          badge: 'bg-orange-100 text-orange-800',
          hover: 'hover:bg-orange-100'
        }
      case '已入库':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-900',
          badge: 'bg-green-100 text-green-800',
          hover: 'hover:bg-green-100'
        }
      case '部分出库':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-900',
          badge: 'bg-purple-100 text-purple-800',
          hover: 'hover:bg-purple-100'
        }
      case '已出库':
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-900',
          badge: 'bg-gray-100 text-gray-800',
          hover: 'hover:bg-gray-100'
        }
      case '已扫描':
        return {
          bg: 'bg-indigo-50',
          border: 'border-indigo-200',
          text: 'text-indigo-900',
          badge: 'bg-indigo-100 text-indigo-800',
          hover: 'hover:bg-indigo-100'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-900',
          badge: 'bg-gray-100 text-gray-800',
          hover: 'hover:bg-gray-100'
        }
    }
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
    const theme = getStatusTheme(status)
    return theme.badge
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

  // 处理扫码记录状态编辑
  const handleBarcodeStatusEdit = (barcodeId, currentStatus) => {
    setEditingBarcodeStatus(barcodeId)
    setNewBarcodeStatus(currentStatus || '已扫描')
  }

  // 保存扫码记录状态
  const handleBarcodeStatusSave = async (barcodeId) => {
    try {
      const response = await fetch(`/api/barcode-scans?id=${barcodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newBarcodeStatus }),
      })

      if (!response.ok) {
        throw new Error('更新扫码记录状态失败')
      }

      setEditingBarcodeStatus(null)
      setNewBarcodeStatus('')
      
      // 刷新数据
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error updating barcode scan status:', error)
      alert('更新扫码记录状态失败')
    }
  }

  // 删除扫码记录
  const handleBarcodeDelete = async (barcodeId) => {
    if (!confirm('确定要删除这条扫码记录吗？')) {
      return
    }

    try {
      const response = await fetch(`/api/barcode-scans?id=${barcodeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('删除扫码记录失败')
      }

      // 刷新数据
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error deleting barcode scan:', error)
      alert('删除扫码记录失败')
    }
  }

  // 检查是否有数据
  const hasData = Object.keys(statusGroups).some(status => 
    statusGroups[status].products.length > 0 || statusGroups[status].scannedOnly.length > 0
  )

  if (!hasData) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">没有找到产品数据</p>
        <p className="text-sm text-gray-400 mt-1">请检查筛选条件或添加新产品</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {statusOrder.map(status => {
        const group = statusGroups[status]
        if (!group || (group.products.length === 0 && group.scannedOnly.length === 0)) return null
        
        const totalCount = group.products.length + group.scannedOnly.length
        const isExpanded = expandedStatuses[status]
        const theme = getStatusTheme(status)
        
        return (
          <div key={status} className={`border ${theme.border} rounded-xl overflow-hidden shadow-sm ${theme.bg}`}>
            <div 
              className={`px-6 py-4 cursor-pointer ${theme.hover} transition-all duration-200 border-b ${theme.border}`}
              onClick={() => toggleStatus(status)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500 transition-transform duration-200" />
                    )}
                    {getStatusIcon(status)}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-lg font-semibold ${theme.text}`}>
                      {statusNames[status]}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Hash className="h-4 w-4 text-gray-400" />
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${theme.badge}`}>
                        {totalCount} 条记录
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {group.products.length > 0 && (
                    <span className="bg-white px-2 py-1 rounded-md border">
                      产品: {group.products.length}
                    </span>
                  )}
                  {group.scannedOnly.length > 0 && (
                    <span className="bg-white px-2 py-1 rounded-md border">
                      扫码: {group.scannedOnly.length}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {isExpanded ? '收起' : '展开'}
                  </span>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">类型</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">客户</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">产品信息</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">规格</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">状态</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">条码</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">时间</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* 渲染产品数据 */}
                      {group.products.map((product) => (
                        <tr key={`product-${product.id}`} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Package className="h-4 w-4 text-blue-500 mr-2" />
                              <span className="text-sm font-medium text-blue-600">产品</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.customer}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.productId}</div>
                            <div className="text-sm text-gray-500">{product.style}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="space-y-1">
                              <div>{product.size}</div>
                              <div className="text-xs text-gray-500">{product.frame} | {product.glass}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingStatus === product.id ? (
                              <div className="flex items-center space-x-2">
                                <select
                                  value={newStatus}
                                  onChange={(e) => setNewStatus(e.target.value)}
                                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  {statusOptions.map(option => (
                                    <option key={option} value={option}>
                                      {option === 'scheduled' ? '已排产' : option}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleStatusSave(product.id)}
                                  className="text-green-600 hover:text-green-800 p-1 rounded-md hover:bg-green-50"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingStatus(null)}
                                  className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(product.status)}`}>
                                  {getStatusName(product.status)}
                                </span>
                                <button
                                  onClick={() => handleStatusEdit(product.id, product.status)}
                                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">{product.barcode}</code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{formatDate(product.createdAt)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setSelectedProduct(product)}
                                className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50 transition-colors"
                                title="查看详情"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => onDelete(product.id)}
                                className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 transition-colors"
                                title="删除产品"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      
                      {/* 渲染仅扫码数据 */}
                      {group.scannedOnly.map((barcode) => (
                        <tr key={`barcode-${barcode.id}`} className="hover:bg-blue-50/50 bg-blue-50/30 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Scan className="h-4 w-4 text-indigo-500 mr-2" />
                              <span className="text-sm font-medium text-indigo-600">仅扫码</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">-</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">-</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">-</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingBarcodeStatus === barcode.id ? (
                              <div className="flex items-center space-x-2">
                                <select
                                  value={newBarcodeStatus}
                                  onChange={(e) => setNewBarcodeStatus(e.target.value)}
                                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  {statusOptions.map(option => (
                                    <option key={option} value={option}>
                                      {option === 'scheduled' ? '已排产' : option}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleBarcodeStatusSave(barcode.id)}
                                  className="text-green-600 hover:text-green-800 p-1 rounded-md hover:bg-green-50"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingBarcodeStatus(null)}
                                  className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                  {barcode.current_status || '已扫描'}
                                </span>
                                <button
                                  onClick={() => handleBarcodeStatusEdit(barcode.id, barcode.current_status)}
                                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <code className="text-sm bg-indigo-100 px-2 py-1 rounded font-mono text-indigo-800">{barcode.barcode_data}</code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{formatDate(barcode.last_scan_time || barcode.created_at)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleBarcodeDelete(barcode.id)}
                                className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 transition-colors"
                                title="删除扫码记录"
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
              </div>
            )}
          </div>
        )
      })}

      {/* 产品详情弹窗 */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <Package className="h-6 w-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900">产品详情</h3>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">客户名称</label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{selectedProduct.customer}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">产品ID</label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{selectedProduct.productId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">样式</label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{selectedProduct.style}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">尺寸</label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{selectedProduct.size}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">边框</label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{selectedProduct.frame}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">玻璃</label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{selectedProduct.glass}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">状态</label>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedProduct.status)}`}>
                      {getStatusName(selectedProduct.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">条码</label>
                    <code className="text-sm bg-gray-100 px-3 py-2 rounded-md font-mono block">{selectedProduct.barcode}</code>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">创建时间</label>
                    <div className="flex items-center text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(selectedProduct.createdAt)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">更新时间</label>
                    <div className="flex items-center text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(selectedProduct.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}