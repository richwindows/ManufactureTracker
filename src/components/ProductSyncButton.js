import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

export default function ProductSyncButton({ onSyncComplete }) {
  const [isLoading, setIsLoading] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [syncStatus, setSyncStatus] = useState(null)

  const handleSync = async () => {
    setIsLoading(true)
    setSyncStatus(null)
    
    try {
      const response = await fetch('/api/sync/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSyncStatus('success')
        setLastSync(new Date().toLocaleString('zh-CN'))
        if (onSyncComplete) {
          onSyncComplete()
        }
      } else {
        setSyncStatus('error')
        console.error('同步失败:', result.error)
      }
      
    } catch (error) {
      setSyncStatus('error')
      console.error('同步请求失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={handleSync}
        disabled={isLoading}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isLoading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        <span>{isLoading ? '同步中...' : '同步产品状态'}</span>
      </button>
      
      {syncStatus && (
        <div className={`flex items-center space-x-1 text-sm ${
          syncStatus === 'success' ? 'text-green-600' : 'text-red-600'
        }`}>
          {syncStatus === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>
            {syncStatus === 'success' ? '同步成功' : '同步失败'}
          </span>
        </div>
      )}
      
      {lastSync && (
        <span className="text-xs text-gray-500">
          最后同步: {lastSync}
        </span>
      )}
    </div>
  )
}