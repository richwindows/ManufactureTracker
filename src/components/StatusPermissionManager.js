'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { STATUS_PERMISSIONS, STATUS_DESCRIPTIONS } from '@/components/ModulePermissionGuard'

export default function StatusPermissionManager() {
  const { user, hasPermission } = useAuth()
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [userPermissions, setUserPermissions] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // 检查是否有用户管理权限
  if (!hasPermission('users.manage') && user?.role !== 'admin') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">您没有权限管理用户状态权限</p>
      </div>
    )
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchUserPermissions = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}/permissions`)
      if (response.ok) {
        const data = await response.json()
        setUserPermissions(data.permissions || {})
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error)
    }
  }

  const handleUserSelect = (user) => {
    setSelectedUser(user)
    fetchUserPermissions(user.id)
  }

  const handlePermissionToggle = async (permission) => {
    if (!selectedUser) return

    setLoading(true)
    try {
      const hasPermission = userPermissions[permission]
      const method = hasPermission ? 'DELETE' : 'POST'
      
      const response = await fetch(`/api/users/${selectedUser.id}/permissions`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permission }),
      })

      if (response.ok) {
        setUserPermissions(prev => ({
          ...prev,
          [permission]: !hasPermission
        }))
        
        setMessage({
          type: 'success',
          text: `${hasPermission ? '移除' : '添加'}权限成功`
        })
      } else {
        throw new Error('操作失败')
      }
    } catch (error) {
      console.error('Error updating permission:', error)
      setMessage({
        type: 'error',
        text: '操作失败，请重试'
      })
    } finally {
      setLoading(false)
    }

    // 清除消息
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800">状态权限管理</h2>

      {/* 消息提示 */}
      {message.text && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* 用户列表 */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">选择用户</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className={`w-full text-left p-3 rounded border transition-colors ${
                  selectedUser?.id === user.id
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">{user.username}</div>
                <div className="text-sm text-gray-600">{user.role}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 权限设置 */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            状态查看权限
            {selectedUser && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                - {selectedUser.username}
              </span>
            )}
          </h3>
          
          {selectedUser ? (
            <div className="space-y-3">
              {Object.entries(STATUS_PERMISSIONS).map(([key, permission]) => (
                <div key={permission} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-gray-900">
                      {STATUS_DESCRIPTIONS[permission]}
                    </div>
                    <div className="text-sm text-gray-600">{permission}</div>
                  </div>
                  <button
                    onClick={() => handlePermissionToggle(permission)}
                    disabled={loading}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      userPermissions[permission]
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {userPermissions[permission] ? '已授权' : '未授权'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              请选择一个用户来管理其状态权限
            </div>
          )}
        </div>
      </div>
    </div>
  )
}