'use client'

import { useState } from 'react'

const ProductStatusSync = () => {
  const [previewData, setPreviewData] = useState(null)
  const [syncResult, setSyncResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 预览需要同步的数据
  const handlePreview = async () => {
    setLoading(true)
    setError(null)
    setSyncResult(null)
    
    try {
      const response = await fetch('/api/products/sync-status')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '获取预览数据失败')
      }
      
      setPreviewData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 执行状态同步
  const handleSync = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/products/sync-status', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '状态同步失败')
      }
      
      setSyncResult(data)
      setPreviewData(null) // 清除预览数据
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 获取状态显示名称
  const getStatusDisplayName = (status) => {
    const statusMap = {
      'cut': '已切割',
      'corner_cleaned': '已清角',
      'stored': '已入库',
      'no_status': '未设置状态'
    }
    return statusMap[status] || status || '未知状态'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">产品状态自动同步</h2>
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '加载中...' : '预览同步'}
          </button>
          <button
            onClick={handleSync}
            disabled={loading || !previewData}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '同步中...' : '执行同步'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">错误: {error}</p>
        </div>
      )}

      {/* 预览数据 */}
      {previewData && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">同步预览</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{previewData.totalScanned}</div>
              <div className="text-sm text-gray-600">已扫描条码数</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{previewData.totalProducts}</div>
              <div className="text-sm text-gray-600">总产品数</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{previewData.updatesNeeded}</div>
              <div className="text-sm text-gray-600">需要更新的产品</div>
            </div>
          </div>

          {previewData.previewUpdates && previewData.previewUpdates.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">需要更新的产品详情</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">条码</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">新状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">扫描设备</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">扫描时间</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.previewUpdates.map((update, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {update.barcode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            {getStatusDisplayName(update.currentStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            {getStatusDisplayName(update.newStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          设备 {update.deviceId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(update.scannedAt).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {previewData.updatesNeeded === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>所有产品状态已是最新，无需同步</p>
            </div>
          )}
        </div>
      )}

      {/* 同步结果 */}
      {syncResult && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">同步结果</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{syncResult.totalScanned}</div>
              <div className="text-sm text-gray-600">已扫描条码数</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{syncResult.updatesNeeded}</div>
              <div className="text-sm text-gray-600">需要更新数</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{syncResult.successfulUpdates}</div>
              <div className="text-sm text-gray-600">成功更新数</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{syncResult.failedUpdates}</div>
              <div className="text-sm text-gray-600">失败更新数</div>
            </div>
          </div>

          {syncResult.updateResults && syncResult.updateResults.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">更新详情</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">条码</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">原状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">新状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">结果</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">扫描设备</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {syncResult.updateResults.map((result, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.barcode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            {getStatusDisplayName(result.oldStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            {getStatusDisplayName(result.newStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            result.success 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {result.success ? '成功' : '失败'}
                          </span>
                          {!result.success && result.error && (
                            <div className="text-xs text-red-500 mt-1">{result.error}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          设备 {result.deviceId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 font-medium">{syncResult.message}</p>
          </div>
        </div>
      )}

      {/* 说明信息 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">功能说明</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 自动匹配产品表和条码扫描表中的条码（忽略设备前缀）</li>
          <li>• 根据扫描设备ID确定产品状态：设备1=已切割，设备2=已清角，设备3=已入库</li>
          <li>• 只更新状态不一致的产品，避免重复操作</li>
          <li>• 支持预览模式，可以先查看需要更新的内容再执行</li>
        </ul>
      </div>
    </div>
  )
}

export default ProductStatusSync