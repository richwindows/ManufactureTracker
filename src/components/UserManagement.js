'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

function UserManagement() {
  const { user, hasPermission, logout, checkAuth } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  // 获取用户列表
  const fetchUsers = async (isRetry = false) => {
    try {
      setLoading(true)
      setError('')
      
      // 强制显示调试信息
      const debugMessages = []
      debugMessages.push(`=== 用户管理调试信息 ===`)
      debugMessages.push(`时间: ${new Date().toLocaleString()}`)
      debugMessages.push(`重试次数: ${retryCount}`)
      debugMessages.push(`当前用户: ${user?.username || '未知'}`)
      debugMessages.push(`用户角色: ${user?.role || '未知'}`)
      
      // 修复权限显示问题
      let permissionsDisplay = '无'
      if (user?.permissions) {
        if (Array.isArray(user.permissions)) {
          // 如果是字符串数组，直接显示
          if (typeof user.permissions[0] === 'string') {
            permissionsDisplay = user.permissions.join(', ')
          } 
          // 如果是对象数组，提取权限名称
          else if (typeof user.permissions[0] === 'object') {
            permissionsDisplay = user.permissions.map(p => 
              p.permission_name || p.name || JSON.stringify(p)
            ).join(', ')
          }
        } else {
          permissionsDisplay = JSON.stringify(user.permissions)
        }
      }
      
      debugMessages.push(`用户权限: ${permissionsDisplay}`)
      debugMessages.push(`权限数组长度: ${user?.permissions?.length || 0}`)
      debugMessages.push(`权限类型: ${typeof user?.permissions}`)
      debugMessages.push(`第一个权限类型: ${user?.permissions?.[0] ? typeof user.permissions[0] : 'undefined'}`)
      debugMessages.push(`是否有管理权限: ${hasPermission('manage_users')}`)
      debugMessages.push(`检查users:view权限: ${hasPermission('users:view')}`)
      
      setDebugInfo(debugMessages.join('\n'))
      
      const response = await fetch('/api/users', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      debugMessages.push(`API响应状态: ${response.status}`)
      debugMessages.push(`API响应状态文本: ${response.statusText}`)
      setDebugInfo(debugMessages.join('\n'))

      if (response.status === 401) {
        debugMessages.push('❌ 认证失败，尝试重新验证...')
        setDebugInfo(debugMessages.join('\n'))
        
        // 尝试重新验证用户身份
        await checkAuth()
        
        if (!isRetry && retryCount < 2) {
          debugMessages.push('🔄 重新验证完成，重试请求...')
          setRetryCount(prev => prev + 1)
          setDebugInfo(debugMessages.join('\n'))
          return fetchUsers(true)
        } else {
          debugMessages.push('❌ 重试次数已达上限，跳转到登录页')
          setError('认证失败，请重新登录')
          setDebugInfo(debugMessages.join('\n'))
          return
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        debugMessages.push(`❌ 错误响应: ${JSON.stringify(errorData)}`)
        setDebugInfo(debugMessages.join('\n'))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      debugMessages.push(`✅ 成功获取 ${data.users?.length || 0} 个用户`)
      setDebugInfo(debugMessages.join('\n'))
      
      setUsers(data.users || [])
      setRetryCount(0)
      
    } catch (err) {
      console.error('获取用户列表失败:', err)
      setError(`获取用户列表失败: ${err.message}`)
      setDebugInfo(prev => prev + `\n❌ 错误: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 强制重新登录
  const forceRelogin = () => {
    setDebugInfo(prev => prev + '\n🔄 执行强制重新登录...')
    logout()
  }

  // 清除错误和调试信息
  const clearMessages = () => {
    setError('')
    setSuccess('')
    setDebugInfo('')
    setRetryCount(0)
  }

  useEffect(() => {
    if (user && hasPermission('manage_users')) {
      fetchUsers()
    } else if (user && hasPermission('users:view')) {
      fetchUsers()
    } else if (user) {
      // 修复权限显示问题
      let permissionsDisplay = '无'
      if (user?.permissions) {
        if (Array.isArray(user.permissions)) {
          if (typeof user.permissions[0] === 'string') {
            permissionsDisplay = user.permissions.join(', ')
          } else if (typeof user.permissions[0] === 'object') {
            permissionsDisplay = user.permissions.map(p => 
              p.permission_name || p.name || JSON.stringify(p)
            ).join(', ')
          }
        }
      }
      
      setDebugInfo(`用户 ${user.username} 没有用户管理权限\n权限列表: ${permissionsDisplay}`)
    }
  }, [user])

  // 检查权限
  if (!user) {
    return (
      <div className="p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-4 rounded mb-4">
          <strong>状态:</strong> 用户未登录
        </div>
        请先登录
      </div>
    )
  }

  // 修复权限检查和显示
  const hasUserManagementPermission = hasPermission('manage_users') || hasPermission('users:view')
  
  if (!hasUserManagementPermission) {
    // 修复权限显示问题
    let permissionsDisplay = '无'
    if (user?.permissions) {
      if (Array.isArray(user.permissions)) {
        if (typeof user.permissions[0] === 'string') {
          permissionsDisplay = user.permissions.join(', ')
        } else if (typeof user.permissions[0] === 'object') {
          permissionsDisplay = user.permissions.map(p => 
            p.permission_name || p.name || JSON.stringify(p)
          ).join(', ')
        }
      }
    }
    
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
          <strong>权限不足:</strong> 您没有权限访问用户管理
          <br />
          <strong>当前用户:</strong> {user.username}
          <br />
          <strong>当前角色:</strong> {user.role}
          <br />
          <strong>当前权限:</strong> {permissionsDisplay}
          <br />
          <strong>权限数组长度:</strong> {user?.permissions?.length || 0}
          <br />
          <strong>权限类型:</strong> {typeof user?.permissions}
          <br />
          <strong>第一个权限:</strong> {user?.permissions?.[0] ? JSON.stringify(user.permissions[0]) : 'undefined'}
        </div>
        
        {/* 调试按钮 */}
        <div className="mt-4 space-x-2">
          <button
            onClick={() => {
              console.log('用户对象:', user)
              console.log('权限数组:', user?.permissions)
              console.log('hasPermission(manage_users):', hasPermission('manage_users'))
              console.log('hasPermission(users:view):', hasPermission('users:view'))
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            🔍 控制台调试
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            返回主页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          返回主页
        </button>
      </div>

      {/* 强制显示调试信息 */}
      <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
        <h3 className="font-semibold mb-2">🔍 实时调试信息</h3>
        <pre className="text-xs whitespace-pre-wrap bg-white p-2 rounded border">
          {debugInfo || '等待调试信息...'}
        </pre>
        <div className="mt-2 space-x-2">
          <button
            onClick={() => fetchUsers()}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            🔄 重新获取用户
          </button>
          <button
            onClick={clearMessages}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            🗑️ 清除信息
          </button>
        </div>
      </div>

      {/* 错误消息 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="flex justify-between items-start">
            <div>
              <strong>❌ 错误:</strong> {error}
              <div className="mt-2 space-x-2">
                <button
                  onClick={() => fetchUsers()}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  🔄 重试
                </button>
                <button
                  onClick={forceRelogin}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  🔑 重新登录
                </button>
                <button
                  onClick={clearMessages}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  🗑️ 清除消息
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 成功消息 */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          ✅ {success}
        </div>
      )}

      {/* 用户表格 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">加载中...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户信息</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部门</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后登录</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {error ? '加载失败' : '暂无用户数据'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'operator' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? '活跃' : '禁用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : '从未登录'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                        编辑
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default UserManagement