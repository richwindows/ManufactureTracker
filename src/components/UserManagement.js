'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import UserList from './UserList'
import UserForm from './UserForm'
import UserFilters from './UserFilters'
import PermissionsModal from './PermissionsModal'

function UserManagement() {
  const { user, loading: authLoading, isAuthenticated, hasRole } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
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
  
  // 权限管理状态
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)
  
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



  // 检查权限
  useEffect(() => {
    if (!authLoading && isAuthenticated && !hasRole('admin')) {
      setError('权限不足：需要管理员权限才能访问用户管理')
      return
    }
    
    if (!authLoading && isAuthenticated && hasRole('admin')) {
      fetchUsers()
    }
  }, [authLoading, isAuthenticated, user, pagination.page, filters])

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
      
      // 添加筛选参数
      if (filters.search?.trim()) params.append('search', filters.search.trim())
      if (filters.role) params.append('role', filters.role)
      if (filters.department?.trim()) params.append('department', filters.department.trim())
      if (filters.isActive !== '') params.append('isActive', filters.isActive)
      
      const response = await fetch(`/api/users-management?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }
      
      if (data.success) {
        setUsers(data.users || [])
        setPagination(prev => ({ ...prev, total: data.total || 0 }))
      } else {
        throw new Error(data.error || '获取用户列表失败')
      }
      
    } catch (err) {
      console.error('获取用户列表失败:', err)
      setError(`获取用户列表失败: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 创建或更新用户
  // 表单处理函数
  const handleFormChange = (field, value) => {
    setUserForm(prev => ({ ...prev, [field]: value }))
  }

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
        headers: { 'Content-Type': 'application/json' },
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



      {/* 筛选器 */}
      <UserFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* 用户列表 */}
      <UserList 
        users={users}
        loading={loading}
        onEditUser={handleEditUser}
        onToggleUserStatus={handleToggleUserStatus}
        onResetPassword={handleResetPassword}
        onDeleteUser={handleDeleteUser}
        onOpenPermissions={(userId) => {
          setSelectedUserId(userId)
          setShowPermissionsModal(true)
        }}
      />

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
      <UserForm
        show={showUserForm}
        editingUser={editingUser}
        userForm={userForm}
        onFormChange={handleFormChange}
        onSubmit={handleSaveUser}
        onCancel={() => {
          setShowUserForm(false)
          setEditingUser(null)
          resetUserForm()
        }}
      />

      {/* 权限管理模态框 */}
      <PermissionsModal 
        show={showPermissionsModal}
        userId={selectedUserId}
        onClose={() => {
          setShowPermissionsModal(false)
          setSelectedUserId(null)
        }}
        onSave={async (userId, permissions) => {
          try {
            const response = await fetch(`/api/users-management/${userId}/permissions`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ permissions })
            })
            
            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || `HTTP ${response.status}`)
            }
            
            setSuccess('用户权限更新成功')
            setShowPermissionsModal(false)
            setSelectedUserId(null)
            
          } catch (err) {
            console.error('保存权限失败:', err)
            setError(`保存权限失败: ${err.message}`)
          }
        }}
      />
    </div>
  )
}

export default UserManagement