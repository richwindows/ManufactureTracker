'use client'

import { useState, useEffect } from 'react'

function PermissionsModal({ 
  show, 
  userId, 
  onClose, 
  onSave 
}) {
  const [availablePermissions, setAvailablePermissions] = useState([])
  const [userPermissions, setUserPermissions] = useState([])
  const [userRole, setUserRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('module') // 新增标签页状态

  useEffect(() => {
    if (show && userId) {
      fetchPermissions()
    }
  }, [show, userId])

  const fetchPermissions = async () => {
    setLoading(true)
    try {
      // 获取所有可用权限
      const permissionsResponse = await fetch('/api/permissions', {
        credentials: 'include'
      })
      const permissionsData = await permissionsResponse.json()
      
      if (permissionsData.success) {
        setAvailablePermissions(permissionsData.permissions)
      }

      // 获取用户角色权限
      const userPermissionsResponse = await fetch(`/api/users-management/${userId}/permissions`, {
        credentials: 'include'
      })
      const userPermissionsData = await userPermissionsResponse.json()
      
      if (userPermissionsData.success) {
        setUserPermissions(userPermissionsData.permissions)
        setUserRole(userPermissionsData.userRole)
      }
    } catch (error) {
      console.error('获取权限失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (permissionId, value) => {
    setUserPermissions(prev => {
      return prev.map(p => 
        p.permission_id === permissionId 
          ? { ...p, granted: value === 'true' }
          : p
      )
    })
  }

  const handleSave = async () => {
    try {
      await onSave(userId, userPermissions)
      onClose()
    } catch (error) {
      console.error('保存权限失败:', error)
    }
  }

  // 按类型分组权限
  const getPermissionsByType = (type) => {
    return userPermissions.filter(p => {
      if (type === 'module') {
        return p.name.startsWith('module.')
      } else if (type === 'status') {
        return p.name.startsWith('status.')
      }
      return false
    })
  }

  // 获取权限类型的中文名称
  const getPermissionTypeName = (type) => {
    const typeNames = {
      'module': '功能模块权限',
      'status': '状态查看权限'
    }
    return typeNames[type] || type
  }

  // 渲染权限列表
  const renderPermissions = (permissions) => {
    if (permissions.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          暂无相关权限
        </div>
      )
    }

    return permissions.map(permission => {
      const currentValue = permission.granted ? 'true' : 'false'
      
      return (
        <div key={permission.permission_id} className="flex items-center justify-between p-3 bg-gray-50 rounded mb-3">
          <div>
            <div className="font-medium">{permission.description || permission.name}</div>
            <div className="text-sm text-gray-600">{permission.name}</div>
          </div>
          <div className="flex space-x-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name={`permission-${permission.permission_id}`}
                value="true"
                checked={currentValue === 'true'}
                onChange={() => handlePermissionChange(permission.permission_id, 'true')}
                className="mr-2 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-green-600">是</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name={`permission-${permission.permission_id}`}
                value="false"
                checked={currentValue === 'false'}
                onChange={() => handlePermissionChange(permission.permission_id, 'false')}
                className="mr-2 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-red-600">否</span>
            </label>
          </div>
        </div>
      )
    })
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            用户权限管理 {userRole && `(角色: ${userRole})`}
          </h3>
          
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-blue-50 rounded">
                <p className="text-sm text-blue-700">
                  注意：修改权限将影响所有具有 <strong>{userRole}</strong> 角色的用户
                </p>
              </div>

              {/* 标签页导航 */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => setActiveTab('module')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'module'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  功能模块权限
                </button>
                <button
                  onClick={() => setActiveTab('status')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'status'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  状态查看权限
                </button>
              </div>

              {/* 权限列表 */}
              <div className="max-h-96 overflow-y-auto">
                {renderPermissions(getPermissionsByType(activeTab))}
              </div>
            </>
          )}
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PermissionsModal