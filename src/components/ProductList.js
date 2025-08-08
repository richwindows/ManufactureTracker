'use client'

import { useState, useEffect } from 'react'
import { Trash2, Eye, Calendar, Package, X, CheckCircle, Clock, Scan, Edit3, Save, XCircle, AlertTriangle, Edit, Check } from 'lucide-react'
import ModulePermissionGuard, { MODULE_PERMISSIONS } from '@/components/ModulePermissionGuard'

export default function ProductList({ products, onDelete, onStatusUpdate, onRefresh }) {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editingStatus, setEditingStatus] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [scannedOnlyBarcodes, setScannedOnlyBarcodes] = useState([])
  // 添加扫码记录编辑相关状态
  const [editingBarcodeStatus, setEditingBarcodeStatus] = useState(null)
  const [newBarcodeStatus, setNewBarcodeStatus] = useState('')
  // 添加条码内容编辑相关状态
  const [editingBarcodeContent, setEditingBarcodeContent] = useState(null)
  const [newBarcodeContent, setNewBarcodeContent] = useState('')

  // 状态选项
  const statusOptions = [
    'pending',
    'in_progress', 
    'completed',
    'shipped'
  ]

  // 条码状态选项
  const barcodeStatusOptions = [
    '已排产',
    '已切割',
    '已清角', 
    '已入库',
    '部分出库',
    '已出库'
  ]

  useEffect(() => {
    fetchScannedOnlyBarcodes()
  }, [])

  const fetchScannedOnlyBarcodes = async () => {
    try {
      const response = await fetch('/api/barcodes/scanned-only')
      if (response.ok) {
        const data = await response.json()
        setScannedOnlyBarcodes(data)
      }
    } catch (error) {
      console.error('Error fetching scanned-only barcodes:', error)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('确定要删除这个产品吗？')) {
      await onDelete(id)
    }
  }

  const handleStatusEdit = (product) => {
    setEditingStatus(product.id)
    setNewStatus(product.status || 'pending')
  }

  const handleStatusSave = async (productId) => {
    try {
      await onStatusUpdate(productId, newStatus)
      setEditingStatus(null)
      setNewStatus('')
    } catch (error) {
      console.error('Error updating status:', error)
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
      } else {
        // 如果没有onRefresh回调，重新获取扫码数据
        fetchScannedOnlyBarcodes()
      }
    } catch (error) {
      console.error('Error updating barcode scan status:', error)
      alert('更新扫码记录状态失败')
    }
  }

  // 取消扫码记录状态编辑
  const handleBarcodeStatusCancel = () => {
    setEditingBarcodeStatus(null)
    setNewBarcodeStatus('')
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
        const errorData = await response.json()
        console.error('API error response:', errorData)
        throw new Error(errorData.details || errorData.error || '更新条码内容失败')
      }

      const result = await response.json()
      console.log('Barcode content updated successfully:', result)

      setEditingBarcodeContent(null)
      setNewBarcodeContent('')
      
      // 刷新数据
      if (onRefresh) {
        onRefresh()
      } else {
        // 如果没有onRefresh回调，重新获取扫码数据
        fetchScannedOnlyBarcodes()
      }
    } catch (error) {
      console.error('Error updating barcode content:', error)
      alert(`更新条码内容失败: ${error.message}`)
    }
  }

  // 取消条码内容编辑
  const handleBarcodeContentCancel = () => {
    setEditingBarcodeContent(null)
    setNewBarcodeContent('')
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
      } else {
        // 如果没有onRefresh回调，重新获取扫码数据
        fetchScannedOnlyBarcodes()
      }
    } catch (error) {
      console.error('Error deleting barcode scan:', error)
      alert('删除扫码记录失败')
    }
  }

  const getStatusName = (status) => {
    const statusMap = {
      '已排产': '已排产',
      '已切割': '已切割',
      '已清角': '已清角',
      '已入库': '已入库',
      '部分出库': '部分出库',
      '已出库': '已出库'
    }
    return statusMap[status] || status
  }

  const getStatusBadge = (status, scannedAt) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'in_progress': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'shipped': { color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      'scheduled': { color: 'bg-blue-100 text-blue-800', icon: Clock }
    }

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: Clock }
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {getStatusName(status)}
        {scannedAt && (
          <Scan className="h-3 w-3 ml-1 text-green-600" title="已扫描" />
        )}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 合并所有数据：产品数据 + 仅扫码数据
  const allData = [
    ...products.map(product => ({ ...product, type: 'product' })),
    ...scannedOnlyBarcodes.map(barcode => ({ ...barcode, type: 'barcode' }))
  ]

  if (allData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-12 text-center">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-6" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无数据</h3>
        <p className="text-gray-400">还没有产品或扫码记录</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        {/* 表格头部信息 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">数据列表</h3>
              <p className="text-sm text-gray-600 mt-1">
                显示 {allData.length} 条记录 
                <span className="mx-2">•</span>
                产品数据: {products.length} 条
                <span className="mx-2">•</span>
                扫码数据: {scannedOnlyBarcodes.length} 条
              </p>
            </div>
          </div>
        </div>

        {/* 表格内容 */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  客户
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  样式
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  尺寸
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  框架
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  玻璃
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  条码
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  扫描时间
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {allData.map((item, index) => {
                const isProduct = item.type === 'product'
                const isBarcode = item.type === 'barcode'
                
                return (
                  <tr 
                    key={`${item.type}-${item.id}`} 
                    className={`hover:bg-gray-50 transition-colors ${
                      isBarcode ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* 类型 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isProduct ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 shadow-sm">
                          <Package className="h-3 w-3 mr-1.5" />
                          产品数据
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 shadow-sm">
                          <Scan className="h-3 w-3 mr-1.5" />
                          扫码数据
                        </span>
                      )}
                    </td>

                    {/* 客户 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {isProduct ? item.customer : '-'}
                      </div>
                    </td>

                    {/* 样式 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {isProduct ? item.style : '-'}
                      </div>
                    </td>

                    {/* 尺寸 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {isProduct ? item.size : '-'}
                      </div>
                    </td>

                    {/* 框架 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {isProduct ? item.frame : '-'}
                      </div>
                    </td>

                    {/* 玻璃 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {isProduct ? item.glass : '-'}
                      </div>
                    </td>

                    {/* 条码 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono">
                        {isProduct ? (
                          item.barcode ? (
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs border">
                              {item.barcode}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">无</span>
                          )
                        ) : (
                          // 扫码数据的条码内容编辑
                          editingBarcodeContent === item.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={newBarcodeContent}
                                onChange={(e) => setNewBarcodeContent(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-xs w-32"
                                placeholder="输入条码内容"
                              />
                              <button
                                onClick={() => handleBarcodeContentSave(item.id)}
                                className="text-green-600 hover:text-green-800 p-1 rounded-md hover:bg-green-50"
                                title="保存"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                              <button
                                onClick={handleBarcodeContentCancel}
                                className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50"
                                title="取消"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs border">
                                {item.barcode_data || '无条码'}
                              </span>
                              <ModulePermissionGuard modulePermission={MODULE_PERMISSIONS.BARCODE_EDIT}>
                                <button
                                  onClick={() => handleBarcodeContentEdit(item.id, item.barcode_data)}
                                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50"
                                  title="编辑条码"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                              </ModulePermissionGuard>
                            </div>
                          )
                        )}
                      </div>
                    </td>

                    {/* 状态 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isProduct ? (
                        editingStatus === item.id ? (
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
                              onClick={() => handleStatusSave(item.id)}
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                              title="保存"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                            <button
                              onClick={handleStatusCancel}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                              title="取消"
                            >
                              <XCircle className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(item.status, item.scannedAt)}
                          </div>
                        )
                      ) : (
                        // 扫码数据的状态编辑
                        editingBarcodeStatus === item.id ? (
                          <div className="flex items-center space-x-2">
                            <select
                              value={newBarcodeStatus}
                              onChange={(e) => setNewBarcodeStatus(e.target.value)}
                              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {barcodeStatusOptions.map(option => (
                                <option key={option} value={option}>
                                  {option === 'scheduled' ? '已排产' : option}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleBarcodeStatusSave(item.id)}
                              className="text-green-600 hover:text-green-800 p-1 rounded-md hover:bg-green-50"
                              title="保存"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleBarcodeStatusCancel}
                              className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50"
                              title="取消"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Scan className="h-3 w-3 mr-1" />
                              {item.current_status || '已扫描'}
                            </span>
                            <button
                              onClick={() => handleBarcodeStatusEdit(item.id, item.current_status)}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50"
                              title="编辑状态"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        )
                      )}
                    </td>

                    {/* 创建时间 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                        {formatDate(isProduct ? item.createdAt : item.scan_time)}
                      </div>
                    </td>

                    {/* 扫描时间 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                        {isProduct ? 
                          (item.scannedAt ? formatDate(item.scannedAt) : '-') : 
                          formatDate(item.scan_time)
                        }
                      </div>
                    </td>

                    {/* 操作 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {isProduct ? (
                          <>
                            <button
                              onClick={() => setSelectedProduct(item)}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 transition-colors"
                              title="查看详情"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusEdit(item)}
                              className="text-green-600 hover:text-green-800 p-2 rounded-md hover:bg-green-50 transition-colors"
                              title="编辑状态"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors"
                              title="删除产品"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleBarcodeDelete(item.id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors"
                            title="删除扫码记录"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 表格底部统计 */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              共 {allData.length} 条记录
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <div className="w-3 h-3 bg-emerald-100 rounded-full mr-2"></div>
                产品数据 ({products.length})
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-amber-100 rounded-full mr-2"></div>
                扫码数据 ({scannedOnlyBarcodes.length})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 产品详情模态框 */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* 模态框头部 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">产品详情</h2>
                  <p className="text-sm text-gray-600 mt-1">查看完整的产品信息</p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-white/50 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* 模态框内容 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">客户</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProduct.customer}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">产品ID</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProduct.productId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">样式</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProduct.style}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">尺寸</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProduct.size}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">框架</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProduct.frame}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">玻璃</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProduct.glass}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">网格</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProduct.grid || '无'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">P.O</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProduct.po}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">批次号</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProduct.batchNo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">创建时间</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{formatDate(selectedProduct.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">更新时间</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{formatDate(selectedProduct.updatedAt)}</p>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">条码</label>
                  <p className="text-sm text-gray-900 font-mono bg-gray-50 p-3 rounded-lg border">
                    {selectedProduct.barcode || '无'}
                  </p>
                </div>
              </div>
            </div>

            {/* 模态框底部 */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
