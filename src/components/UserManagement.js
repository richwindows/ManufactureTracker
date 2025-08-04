'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

function UserManagement() {
  const { user, loading: authLoading, isAuthenticated, hasRole } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [debugInfo, setDebugInfo] = useState(null)
  
  // 用户表单状态
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    fullName: '',
    role: 'viewer',
    department: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  
  // 筛选和搜索状态
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    department: '',
    isActive: ''
  })
  
  // 分页状态
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  })

  // 调试认证状态
  const debugAuth = async () => {
    try {
      const response = await fetch('/api/debug-auth', {
        credentials: 'include'
      })
      const data = await response.json()
      setDebugInfo(data)
      console.log('调试信息:', data)
    } catch (err) {
      console.error('调试失败:', err)
    }
  }

  // 获取用户列表
  const fetchUsers = async () => {
    if (!user) return
    
    setLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      // 添加筛选参数（过滤空值）
      if (filters.search?.trim()) params.append('search', filters.search.trim())
      if (filters.role) params.append('role', filters.role)
      if (filters.department?.trim()) params.append('department', filters.department.trim())
      if (filters.isActive !== '') params.append('isActive', filters.isActive)
      
      console.log('请求参数:', params.toString())
      
      const response = await fetch(`/api/users-management?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      const data = await response.json()
      console.log('API响应:', data)
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }
      
      if (data.success) {
        setUsers(data.users || [])
        setPagination(prev => ({
          ...prev,
          total: data.total || 0
        }))
      } else {
        throw new Error(data.error || '获取用户列表失败')
      }
      
    } catch (err) {
      console.error('获取用户列表失败:', err)
      setError(`获取用户列表失败: ${err.message}`)
      
      // 如果是权限问题，提供更详细的错误信息
      if (err.message.includes('权限') || err.message.includes('403')) {
        setError('权限不足：请确保您有管理员权限，并且数据库权限系统已正确设置')
      }
    } finally {
      setLoading(false)
    }
  }

  // 创建或更新用户
  const handleSaveUser = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // 表单验证
    if (!userForm.username || !userForm.email || !userForm.fullName) {
      setError('请填写必填字段')
      return
    }
    
    if (!editingUser && (!userForm.password || userForm.password !== userForm.confirmPassword)) {
      setError('密码不能为空且两次输入必须一致')
      return
    }
    
    if (editingUser && userForm.password && userForm.password !== userForm.confirmPassword) {
      setError('两次输入的密码必须一致')
      return
    }
    
    try {
      const url = editingUser ? `/api/users-management/${editingUser.id}` : '/api/users-management'
      const method = editingUser ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          username: userForm.username,
          email: userForm.email,
          full_name: userForm.fullName,
          role: userForm.role,
          department: userForm.department,
          phone: userForm.phone,
          ...(userForm.password && { password: userForm.password })
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      setSuccess(editingUser ? '用户更新成功' : '用户创建成功')
      setShowUserForm(false)
      setEditingUser(null)
      resetUserForm()
      fetchUsers()
      
    } catch (err) {
      console.error('保存用户失败:', err)
      setError(`保存用户失败: ${err.message}`)
    }
  }

  // 删除用户
  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`确定要删除用户 "${username}" 吗？此操作不可恢复。`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/users-management/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      setSuccess('用户删除成功')
      fetchUsers()
      
    } catch (err) {
      console.error('删除用户失败:', err)
      setError(`删除用户失败: ${err.message}`)
    }
  }

  // 切换用户状态
  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`/api/users-management/${userId}/toggle-status`, {
        method: 'PATCH',
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      setSuccess(`用户状态已${currentStatus ? '禁用' : '启用'}`)
      fetchUsers()
      
    } catch (err) {
      console.error('切换用户状态失败:', err)
      setError(`切换用户状态失败: ${err.message}`)
    }
  }

  // 重置密码
  const handleResetPassword = async (userId, username) => {
    const newPassword = prompt(`为用户 "${username}" 设置新密码:`)
    if (!newPassword) return
    
    if (newPassword.length < 6) {
      setError('密码长度至少6位')
      return
    }
    
    try {
      const response = await fetch(`/api/users-management/${userId}/reset-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ newPassword })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      setSuccess('密码重置成功')
      
    } catch (err) {
      console.error('重置密码失败:', err)
      setError(`重置密码失败: ${err.message}`)
    }
  }

  // 重置表单
  const resetUserForm = () => {
    setUserForm({
      username: '',
      email: '',
      fullName: '',
      role: 'viewer',
      department: '',
      phone: '',
      password: '',
      confirmPassword: ''
    })
  }

  // 编辑用户
  const handleEditUser = (userData) => {
    setEditingUser(userData)
    setUserForm({
      username: userData.username,
      email: userData.email || '',
      fullName: userData.full_name || '',
      role: userData.role,
      department: userData.department || '',
      phone: userData.phone || '',
      password: '',
      confirmPassword: ''
    })
    setShowUserForm(true)
  }

  // 处理筛选变化
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // 清除消息
  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  // 组件挂载时获取用户列表
  useEffect(() => {
    if (isAuthenticated && hasRole('admin')) {
      fetchUsers()
    }
  }, [isAuthenticated, hasRole, pagination.page, pagination.limit, filters])

  // 如果正在加载认证状态
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  // 如果未认证
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-600">请先登录</div>
      </div>
    )
  }

  // 如果不是管理员
  if (!hasRole('admin')) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-600">权限不足，只有管理员可以访问用户管理</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">用户管理</h1>
        <div className="space-x-2">
          <button
            onClick={debugAuth}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            调试认证
          </button>
          <button
            onClick={() => {
              resetUserForm()
              setEditingUser(null)
              setShowUserForm(true)
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            添加用户
          </button>
        </div>
      </div>

      {/* 错误和成功消息 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button onClick={clearMessages} className="ml-2 text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
          <button onClick={clearMessages} className="ml-2 text-green-500 hover:text-green-700">
            ×
          </button>
        </div>
      )}

      {/* 调试信息 */}
      {debugInfo && (
        <div className="mb-4 p-4 bg-gray-100 border rounded">
          <h3 className="font-bold mb-2">调试信息:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* 筛选器 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="搜索用户名、姓名或邮箱"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">所有角色</option>
            <option value="admin">管理员</option>
            <option value="operator">操作员</option>
            <option value="viewer">查看者</option>
          </select>
          <input
            type="text"
            placeholder="部门"
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <select
            value={filters.isActive}
            onChange={(e) => handleFilterChange('isActive', e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">所有状态</option>
            <option value="true">启用</option>
            <option value="false">禁用</option>
          </select>
        </div>
      </div>

      {/* 用户列表 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-lg">加载中...</div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  部门
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最后登录
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((userData) => (
                <tr key={userData.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {userData.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {userData.username} • {userData.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      userData.role === 'admin' ? 'bg-red-100 text-red-800' :
                      userData.role === 'operator' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {userData.role === 'admin' ? '管理员' :
                       userData.role === 'operator' ? '操作员' : '查看者'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {userData.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      userData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {userData.is_active ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {userData.last_login_at ? 
                      new Date(userData.last_login_at).toLocaleString() : 
                      '从未登录'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditUser(userData)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleToggleUserStatus(userData.id, userData.is_active)}
                      className={userData.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                    >
                      {userData.is_active ? '禁用' : '启用'}
                    </button>
                    <button
                      onClick={() => handleResetPassword(userData.id, userData.username)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      重置密码
                    </button>
                    {userData.username !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(userData.id, userData.username)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">暂无用户数据</div>
            </div>
          )}
        </div>
      )}

      {/* 分页 */}
      {pagination.total > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            显示 {((pagination.page - 1) * pagination.limit) + 1} 到{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} 条，
            共 {pagination.total} 条记录
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="px-3 py-1">
              第 {pagination.page} 页，共 {Math.ceil(pagination.total / pagination.limit)} 页
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* 用户表单模态框 */}
      {showUserForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser ? '编辑用户' : '添加用户'}
              </h3>
              <form onSubmit={handleSaveUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">用户名 *</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">邮箱 *</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">姓名 *</label>
                  <input
                    type="text"
                    value={userForm.fullName}
                    onChange={(e) => setUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">角色</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="viewer">查看者</option>
                    <option value="operator">操作员</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">部门</label>
                  <input
                    type="text"
                    value={userForm.department}
                    onChange={(e) => setUserForm(prev => ({ ...prev, department: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">电话</label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    密码 {!editingUser && '*'}
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required={!editingUser}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    确认密码 {!editingUser && '*'}
                  </label>
                  <input
                    type="password"
                    value={userForm.confirmPassword}
                    onChange={(e) => setUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required={!editingUser}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserForm(false)
                      setEditingUser(null)
                      resetUserForm()
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {editingUser ? '更新' : '创建'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement