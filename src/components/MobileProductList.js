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
  BarChart3
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">产品详情</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {/* 基本信息 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">客户:</span>
              <span className="font-medium">{product.customer}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">条码:</span>
              <span className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                {product.barcode || '无条码'}
              </span>
            </div>
          </div>

          {/* 详细信息 - 现在显示在弹窗中 */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-gray-900">产品规格</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">样式:</span>
                <span className="font-medium">{product.style || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">尺寸:</span>
                <span className="font-medium">{product.size || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">边框:</span>
                <span className="font-medium">{product.frame || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">玻璃:</span>
                <span className="font-medium">{product.glass || '-'}</span>
              </div>
            </div>
          </div>

          {/* 状态编辑 */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">状态管理</h4>
            
            {editingStatus ? (
              <div className="space-y-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="scheduled">已排产</option>
                  <option value="已切割">已切割</option>
                  <option value="已清角">已清角</option>
                  <option value="已入库">已入库</option>
                  <option value="部分出库">部分出库</option>
                  <option value="已出库">已出库</option>
                </select>
                <div className="flex space-x-2">
                  <button
                    onClick={handleStatusSave}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center space-x-2"
                  >
                    <Check className="h-4 w-4" />
                    <span>保存</span>
                  </button>
                  <button
                    onClick={() => setEditingStatus(false)}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center justify-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>取消</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">当前状态:</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                    {product.status === 'scheduled' ? '已排产' : product.status}
                  </span>
                </div>
                <button
                  onClick={() => setEditingStatus(true)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>编辑状态</span>
                </button>
              </div>
            )}
          </div>

          {/* 时间信息 */}
          {product.scanned_at && (
            <div className="border-t pt-4">
              <div className="text-sm text-gray-500">
                扫描时间: {formatDate(product.scanned_at)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 移动端产品列表组件
const MobileProductList = ({ 
  products = [], 
  onStatusUpdate, 
  onRefresh
}) => {
  const [expandedGroups, setExpandedGroups] = useState({})
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // 使用状态过滤 Hook
  const { filterStatusGroups } = useStatusFilter()

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
        return 'bg-yellow-600 hover:bg-yellow-700'  // 改为黄色
      case '已出库':
        return 'bg-green-600 hover:bg-green-700'    // 改为绿色
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
          const group = statusGroups[status] // 使用过滤后的状态组
          if (!group || group.products.length === 0) {
            return null
          }

          const isExpanded = expandedGroups[status] === true // 默认不展开

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
                  {group.products.map((product, index) => (
                    <div key={`${product.id}-${index}`} className="p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between space-x-3">
                        {/* 左侧信息区域 */}
                        <div className="flex-1 min-w-0 grid grid-cols-3 gap-4">
                          {/* 客户名称 */}
                          <div className="flex items-center space-x-2 min-w-0">
                            <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="font-medium text-gray-900 text-sm truncate">
                              {product.customer}
                            </span>
                          </div>
                          
                          {/* 条码 */}
                          <div className="flex items-center space-x-2 min-w-0">
                            <BarChart3 className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-600 truncate">
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
                          {/* 状态快捷按钮 - 对所有产品显示，包括仅扫码数据 */}
                          <button
                            onClick={async () => {
                              try {
                                console.log('Updating product to 部分出库:', product.id)
                                await onStatusUpdate(product.id, '部分出库')
                                console.log('Status update completed, calling refresh...')
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
                                console.log('Updating product to 已出库:', product.id)
                                await onStatusUpdate(product.id, '已出库')
                                console.log('Status update completed, calling refresh...')
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