import React, { useState } from 'react'
import { 
  Package, 
  Clock, 
  Scissors, 
  Square, 
  Archive, 
  Truck as TruckIcon, 
  CheckCircle, 
  Scan,
  Edit,
  Check,
  X,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import ModulePermissionGuard, { MODULE_PERMISSIONS } from './ModulePermissionGuard'

const ProductListByStatus = ({ 
  products = [], 
  scannedOnlyBarcodes = [], 
  onStatusUpdate, 
  onRefresh,
  filterStatusGroups = (groups) => groups 
}) => {
  const [editingStatus, setEditingStatus] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [editingBarcodeStatus, setEditingBarcodeStatus] = useState(null)
  const [newBarcodeStatus, setNewBarcodeStatus] = useState('')
  const [editingBarcodeContent, setEditingBarcodeContent] = useState(null)
  const [newBarcodeContent, setNewBarcodeContent] = useState('')
  const [expandedGroups, setExpandedGroups] = useState({}) // 新增：控制展开状态

  // 切换组展开状态
  const toggleGroupExpansion = (status) => {
    setExpandedGroups(prev => ({
      ...prev,
      [status]: !prev[status]
    }))
  }

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '未知'
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 获取状态徽章样式
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
      case '已扫描':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取状态名称
  const getStatusName = (status) => {
    return status === 'scheduled' ? '已排产' : status
  }

  // 处理条码内容编辑
  const handleBarcodeContentEdit = (barcodeId, currentContent) => {
    setEditingBarcodeContent(barcodeId)
    setNewBarcodeContent(currentContent || '')
  }

  // 保存条码内容
  const handleBarcodeContentSave = async (barcodeId) => {
    if (!newBarcodeContent.trim()) {
      alert('条码内容不能为空')
      return
    }

    try {
      const response = await fetch(`/api/barcode-scans?id=${barcodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barcode_data: newBarcodeContent.trim() }),
      })

      if (!response.ok) {
        throw new Error('更新条码内容失败')
      }

      setEditingBarcodeContent(null)
      setNewBarcodeContent('')
      
      // 显示成功提示
      alert('条码内容更新成功')
      
      // 刷新数据
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error updating barcode content:', error)
      alert('更新条码内容失败')
    }
  }

  // 取消条码内容编辑
  const handleBarcodeContentCancel = () => {
    setEditingBarcodeContent(null)
    setNewBarcodeContent('')
  }

  // 处理状态编辑
  const handleStatusEdit = (productId, currentStatus) => {
    setEditingStatus(productId)
    setNewStatus(currentStatus || '已排产')
  }

  // 保存状态
  const handleStatusSave = async (productId) => {
    try {
      await onStatusUpdate(productId, newStatus)
      setEditingStatus(null)
      setNewStatus('')
      
      // 显示成功提示
      alert('产品状态更新成功')
      
      // 刷新数据
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('更新状态失败')
    }
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
        body: JSON.stringify({ current_status: newBarcodeStatus }),
      })

      if (!response.ok) {
        throw new Error('更新扫码记录状态失败')
      }

      setEditingBarcodeStatus(null)
      setNewBarcodeStatus('')
      
      // 显示成功提示
      alert('扫码记录状态更新成功')
      
      // 刷新数据
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error updating barcode status:', error)
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

      // 显示成功提示
      alert('扫码记录删除成功')

      // 刷新数据
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error deleting barcode:', error)
      alert('删除扫码记录失败')
    }
  }

  // 删除产品
  const handleProductDelete = async (productId) => {
    if (!confirm('确定要删除这个产品吗？')) {
      return
    }
  
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })
  
      if (response.ok) {
        // 显示成功提示
        alert('产品删除成功')
        
        // 刷新数据
        if (onRefresh) {
          onRefresh()
        }
      } else {
        alert('删除失败')
      }
    } catch (error) {
      console.error('删除产品时出错:', error)
      alert('删除失败')
    }
  }

  // 合并产品数据，按状态分组（移除仅扫码数据处理）
  const groupByStatus = () => {
    const groups = {}
    
    // 只处理产品数据
    products.forEach(product => {
      const status = product.status || '已排产'
      if (!groups[status]) {
        groups[status] = { products: [] }
      }
      groups[status].products.push(product)
    })
    
    return groups
  }

  // 应用状态过滤
  const allStatusGroups = groupByStatus()
  const statusGroups = filterStatusGroups(allStatusGroups)

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

  return (
    <div className="space-y-8">
      {statusOrder.map(status => {
        const group = statusGroups[status]
        if (!group || group.products.length === 0) {
          return null
        }

        const isExpanded = expandedGroups[status] || false

        return (
          <div key={status} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleGroupExpansion(status)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  )}
                  {getStatusIcon(status)}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {statusNames[status] || status}
                  </h3>
                  <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-600 border">
                    {group.products.length} 项
                  </span>
                </div>
              </div>
            </div>

            {/* 只有在展开时才显示内容 */}
            {isExpanded && (
              <>
                {/* 产品表格 */}
                {group.products.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">样式</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">尺寸</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">边框</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">玻璃</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">条码</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">扫描时间</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {group.products.map((item, index) => (
                          <tr key={`${item.id}-${index}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.customer}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.style}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.size}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.frame}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.glass}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs border">
                                {item.barcode || '无条码'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingStatus === item.id ? (
                                <div className="flex items-center space-x-2">
                                  <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded text-xs"
                                  >
                                    <option value="scheduled">已排产</option>
                                    <option value="已切割">已切割</option>
                                    <option value="已清角">已清角</option>
                                    <option value="已入库">已入库</option>
                                    <option value="部分出库">部分出库</option>
                                    <option value="已出库">已出库</option>
                                  </select>
                                  <button
                                    onClick={() => handleStatusSave(item.id)}
                                    className="text-green-600 hover:text-green-800 p-1 rounded-md hover:bg-green-50"
                                    title="保存"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => setEditingStatus(null)}
                                    className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50"
                                    title="取消"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                                    {getStatusName(item.status)}
                                  </span>
                                  <ModulePermissionGuard modulePermission={MODULE_PERMISSIONS.STATUS_EDIT}>
                                    <button
                                      onClick={() => handleStatusEdit(item.id, item.status)}
                                      className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50"
                                      title="编辑状态"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </button>
                                  </ModulePermissionGuard>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.scanned_at ? formatDate(item.scanned_at) : '未扫描'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <ModulePermissionGuard modulePermission={MODULE_PERMISSIONS.PRODUCT_DELETE}>
                                  <button
                                    onClick={() => handleProductDelete(item.id)}
                                    className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50"
                                    title="删除产品"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </ModulePermissionGuard>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ProductListByStatus