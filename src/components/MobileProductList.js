'use client'

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
  Info,
  ChevronDown,
  ChevronRight,
  User,
  BarChart3,
  PackageCheck // 新增图标
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useStatusFilter } from '@/hooks/useStatusFilter'

// 详情弹窗组件
const ProductDetailModal = ({ product, isOpen, onClose, onStatusUpdate }) => {
  const [editingStatus, setEditingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState(product?.status || '已排产')

  if (!isOpen || !product) return null

  const handleStatusSave = async () => {
    try {
      await onStatusUpdate(product.id, newStatus)
      setEditingStatus(false)
      alert('状态更新成功')
      onClose()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('更新状态失败')
    }
  }

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

  const statusOptions = [
    'scheduled',
    '已切割',
    '已清角', 
    '已入库',
    '部分出库',
    '已出库',
    '已扫描'
  ]

  const statusNames = {
    'scheduled': '已排产',
    '已切割': '已切割',
    '已清角': '已清角',
    '已入库': '已入库',
    '部分出库': '部分出库',
    '已出库': '已出库',
    '已扫描': '已扫描'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">产品详情</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">客户</label>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-900">{product.customer}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">条码</label>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                  {product.barcode || '无条码'}
                </span>
              </div>
            </div>
          </div>

          {/* 详细规格 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">产品规格</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">样式:</span> <span className="text-gray-900">{product.style || '未知'}</span></div>
              <div><span className="text-gray-500">尺寸:</span> <span className="text-gray-900">{product.size || '未知'}</span></div>
              <div><span className="text-gray-500">厚度:</span> <span className="text-gray-900">{product.thickness || '未知'}</span></div>
              <div><span className="text-gray-500">边型:</span> <span className="text-gray-900">{product.edge_type || '未知'}</span></div>
              <div><span className="text-gray-500">数量:</span> <span className="text-gray-900">{product.quantity || '未知'}</span></div>
              <div><span className="text-gray-500">单位:</span> <span className="text-gray-900">{product.unit || '未知'}</span></div>
            </div>
          </div>

          {/* 状态编辑 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">状态管理</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">当前状态:</span>
              {editingStatus ? (
                <div className="flex items-center space-x-2">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {statusNames[status] || status}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleStatusSave}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingStatus(false)
                      setNewStatus(product.status || '已排产')
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {statusNames[product.status] || product.status || '已排产'}
                  </span>
                  <button
                    onClick={() => setEditingStatus(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 时间信息 */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">时间信息</h3>
            <div className="text-sm space-y-1">
              <div><span className="text-gray-500">创建时间:</span> <span className="text-gray-900">{formatDate(product.created_at)}</span></div>
              <div><span className="text-gray-500">更新时间:</span> <span className="text-gray-900">{formatDate(product.updated_at)}</span></div>
              {product.scanned_at && (
                <div><span className="text-gray-500">扫描时间:</span> <span className="text-gray-900">{formatDate(product.scanned_at)}</span></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const MobileProductList = ({ 
  products = [], 
  onStatusUpdate, 
  onRefresh
}) => {
  const [expandedGroups, setExpandedGroups] = useState({})
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [batchUpdating, setBatchUpdating] = useState(false)
  
  // 使用状态过滤 Hook
  const { filterStatusGroups } = useStatusFilter()

  // 批量入库函数
  const handleBatchStorage = async (customer, productsInGroup) => {
    if (!customer) {
      alert('无法获取客户信息')
      return
    }

    const confirmMessage = `确定要将客户 "${customer}" 的 ${productsInGroup.length} 个产品全部入库吗？`
    if (!confirm(confirmMessage)) {
      return
    }

    setBatchUpdating(true)
    try {
      const productIds = productsInGroup.map(p => p.id)
      
      const response = await fetch('/api/products/batch-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds: productIds,
          status: '已入库',
          customer: customer
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        alert(`✅ 批量入库成功！\n${result.message}`)
        if (onRefresh) {
          await onRefresh()
        }
      } else {
        throw new Error(result.error || '批量入库失败')
      }
    } catch (error) {
      console.error('批量入库错误:', error)
      alert(`❌ 批量入库失败: ${error.message}`)
    } finally {
      setBatchUpdating(false)
    }
  }

  // 批量出库函数
  const handleBatchShipment = async (customer, productsInGroup) => {
    if (!customer) {
      alert('无法获取客户信息')
      return
    }

    const confirmMessage = `确定要将客户 "${customer}" 的 ${productsInGroup.length} 个产品全部出库吗？`
    if (!confirm(confirmMessage)) {
      return
    }

    setBatchUpdating(true)
    try {
      const productIds = productsInGroup.map(p => p.id)
      
      const response = await fetch('/api/products/batch-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds: productIds,
          status: '已出库',
          customer: customer
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        alert(`✅ 批量出库成功！\n${result.message}`)
        if (onRefresh) {
          await onRefresh()
        }
      } else {
        throw new Error(result.error || '批量出库失败')
      }
    } catch (error) {
      console.error('批量出库错误:', error)
      alert(`❌ 批量出库失败: ${error.message}`)
    } finally {
      setBatchUpdating(false)
    }
  }

  // 切换组展开状态
  const toggleGroupExpansion = (status) => {
    setExpandedGroups(prev => ({
      ...prev,
      [status]: !prev[status]
    }))
  }

  // 显示产品详情
  const showProductDetail = (product) => {
    setSelectedProduct(product)
    setShowDetailModal(true)
  }

  // 关闭详情弹窗
  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedProduct(null)
    if (onRefresh) {
      onRefresh()
    }
  }

  // 按状态分组
  const groupByStatus = () => {
    const groups = {}
    products.forEach(product => {
      const status = product.status || '已排产'
      if (!groups[status]) {
        groups[status] = { products: [] }
      }
      groups[status].products.push(product)
    })
    return groups
  }

  // 按客户分组产品
  const groupByCustomer = (products) => {
    const customerGroups = {}
    products.forEach(product => {
      const customer = product.customer || '未知客户'
      if (!customerGroups[customer]) {
        customerGroups[customer] = []
      }
      customerGroups[customer].push(product)
    })
    return customerGroups
  }

  // 应用状态过滤 - 只显示有权限的状态
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
        return <Clock className="h-4 w-4 text-blue-600" />
      case '已切割':
        return <Scissors className="h-4 w-4 text-yellow-600" />
      case '已清角':
        return <Square className="h-4 w-4 text-orange-600" />
      case '已入库':
        return <Archive className="h-4 w-4 text-green-600" />
      case '部分出库':
        return <TruckIcon className="h-4 w-4 text-purple-600" />
      case '已出库':
        return <CheckCircle className="h-4 w-4 text-gray-600" />
      case '已扫描':
        return <Scan className="h-4 w-4 text-blue-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  // 获取状态对应的按钮颜色类
  const getStatusButtonClass = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-600 hover:bg-blue-700'
      case '已切割':
        return 'bg-yellow-600 hover:bg-yellow-700'
      case '已清角':
        return 'bg-orange-600 hover:bg-orange-700'
      case '已入库':
        return 'bg-green-600 hover:bg-green-700'
      case '部分出库':
        return 'bg-yellow-600 hover:bg-yellow-700'
      case '已出库':
        return 'bg-green-600 hover:bg-green-700'
      case '已扫描':
        return 'bg-blue-600 hover:bg-blue-700'
      default:
        return 'bg-gray-600 hover:bg-gray-700'
    }
  }

  return (
    <>
      <div className="space-y-3">
        {statusOrder.map(status => {
          const group = statusGroups[status]
          if (!group || group.products.length === 0) {
            return null
          }

          const isExpanded = expandedGroups[status] === true
          const customerGroups = groupByCustomer(group.products)

          return (
            <div key={status} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div 
                className="bg-gray-50 px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleGroupExpansion(status)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    )}
                    {getStatusIcon(status)}
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {statusNames[status] || status}
                    </h3>
                    <span className="bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-600 border">
                      {group.products.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* 只有在展开时才显示内容 */}
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {Object.entries(customerGroups).map(([customer, customerProducts]) => (
                    <div key={customer} className="p-3">
                      {/* 客户标题和批量操作按钮 */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900 text-sm">
                            {customer} ({customerProducts.length}个产品)
                          </span>
                        </div>
                        
                        {/* 批量操作按钮组 */}
                        <div className="flex items-center space-x-2">
                          {/* 批量入库按钮 - 只在非"已入库"和非"已出库"状态显示 */}
                          {status !== '已入库' && status !== '已出库' && (
                            <button
                              onClick={() => handleBatchStorage(customer, customerProducts)}
                              disabled={batchUpdating}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs font-medium shadow-sm flex items-center space-x-1"
                            >
                              <PackageCheck className="h-3 w-3" />
                              <span>{batchUpdating ? '处理中...' : '批量入库'}</span>
                            </button>
                          )}
                          
                          {/* 批量出库按钮 - 只在"已入库"状态显示 */}
                          {status === '已入库' && (
                            <button
                              onClick={() => handleBatchShipment(customer, customerProducts)}
                              disabled={batchUpdating}
                              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs font-medium shadow-sm flex items-center space-x-1"
                            >
                              <TruckIcon className="h-3 w-3" />
                              <span>{batchUpdating ? '处理中...' : '批量出库'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* 该客户的产品列表 */}
                      <div className="space-y-2">
                        {customerProducts.map((product, index) => (
                          <div key={`${product.id}-${index}`} className="bg-gray-50 p-2 rounded hover:bg-gray-100 transition-colors">
                            <div className="flex items-center justify-between space-x-3">
                              {/* 左侧信息区域 */}
                              <div className="flex-1 min-w-0 grid grid-cols-2 gap-4">
                                {/* 条码 */}
                                <div className="flex items-center space-x-2 min-w-0">
                                  <BarChart3 className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                  <span className="bg-white px-2 py-1 rounded text-xs font-mono text-gray-600 truncate">
                                    {product.barcode || '无条码'}
                                  </span>
                                </div>

                                {/* 当前状态 */}
                                <div className="flex items-center space-x-2 min-w-0">
                                  {getStatusIcon(product.status || 'scheduled')}
                                  <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                                    {statusNames[product.status] || product.status || '已排产'}
                                  </span>
                                </div>
                              </div>
                              
                              {/* 右侧按钮组 */}
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                {/* 状态快捷按钮 */}
                                <button
                                  onClick={async () => {
                                    try {
                                      await onStatusUpdate(product.id, '部分出库')
                                      if (onRefresh) {
                                        await onRefresh()
                                      }
                                    } catch (error) {
                                      console.error('Error updating status:', error)
                                      alert('更新状态失败')
                                    }
                                  }}
                                  className={`${getStatusButtonClass('部分出库')} text-white px-2 py-1 rounded text-xs font-medium shadow-sm whitespace-nowrap`}
                                >
                                  部分出库
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      await onStatusUpdate(product.id, '已出库')
                                      if (onRefresh) {
                                        await onRefresh()
                                      }
                                    } catch (error) {
                                      console.error('Error updating status:', error)
                                      alert('更新状态失败')
                                    }
                                  }}
                                  className={`${getStatusButtonClass('已出库')} text-white px-2 py-1 rounded text-xs font-medium shadow-sm whitespace-nowrap`}
                                >
                                  已出库
                                </button>
                                
                                {/* 详情按钮 */}
                                <button
                                  onClick={() => showProductDetail(product)}
                                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center space-x-1 shadow-sm"
                                >
                                  <Info className="h-3 w-3" />
                                  <span className="text-xs font-medium">详情</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 详情弹窗 */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={showDetailModal}
        onClose={closeDetailModal}
        onStatusUpdate={onStatusUpdate}
      />
    </>
  )
}

export default MobileProductList