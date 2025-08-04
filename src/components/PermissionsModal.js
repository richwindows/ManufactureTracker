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
  const [loading, setLoading] = useState(false)

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

      // 获取用户特定权限
      const userPermissionsResponse = await fetch(`/api/users-management/${userId}/permissions`, {
        credentials: 'include'
      })
      const userPermissionsData = await userPermissionsResponse.json()
      
      if (userPermissionsData.success) {
        setUserPermissions(userPermissionsData.permissions)
      }
    } catch (error) {
      console.error('获取权限失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (permissionId, value) => {
    setUserPermissions(prev => {
      const existing = prev.find(p => p.permission_id === permissionId)
      if (existing) {
        return prev.map(p => 
          p.permission_id === permissionId 
            ? { ...p, granted: value === 'true' }
            : p
        )
      } else {
        return [...prev, {
          permission_id: permissionId,
          granted: value === 'true'
        }]
      }
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

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">用户权限管理</h3>
          
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {Object.entries(
                availablePermissions.reduce((groups, permission) => {
                  const resource = permission.resource || '其他'
                  if (!groups[resource]) groups[resource] = []
                  groups[resource].push(permission)
                  return groups
                }, {})
              ).map(([resource, permissions]) => (
                <div key={resource} className="mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                    {resource}
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {permissions.map(permission => {
                      const userPerm = userPermissions.find(up => up.permission_id === permission.id)
                      const currentValue = userPerm ? (userPerm.granted ? 'true' : 'false') : 'default'
                      
                      return (
                        <div key={permission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{permission.name}</div>
                            <div className="text-sm text-gray-600">{permission.description}</div>
                          </div>
                          <div className="flex space-x-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`permission-${permission.id}`}
                                value="default"
                                checked={currentValue === 'default'}
                                onChange={() => {
                                  setUserPermissions(prev => 
                                    prev.filter(p => p.permission_id !== permission.id)
                                  )
                                }}
                                className="mr-1"
                              />
                              <span className="text-sm">默认</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`permission-${permission.id}`}
                                value="true"
                                checked={currentValue === 'true'}
                                onChange={() => handlePermissionChange(permission.id, 'true')}
                                className="mr-1"
                              />
                              <span className="text-sm text-green-600">允许</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`permission-${permission.id}`}
                                value="false"
                                checked={currentValue === 'false'}
                                onChange={() => handlePermissionChange(permission.id, 'false')}
                                className="mr-1"
                              />
                              <span className="text-sm text-red-600">拒绝</span>
                            </label>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
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