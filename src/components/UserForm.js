'use client'

import { useState, useEffect } from 'react'

function UserForm({ 
  show, 
  editingUser, 
  userForm, 
  onFormChange, 
  onSubmit, 
  onCancel 
}) {
  const [roles, setRoles] = useState([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [rolesError, setRolesError] = useState('')

  // 获取角色列表
  useEffect(() => {
    if (show) {
      fetchRoles()
    }
  }, [show])

  const fetchRoles = async () => {
    setLoadingRoles(true)
    setRolesError('')
    try {
      const response = await fetch('/api/roles', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        setRoles(data.roles || [])
      } else {
        console.error('获取角色列表失败:', data.error)
        setRolesError(data.error || '获取角色列表失败')
      }
    } catch (error) {
      console.error('获取角色列表错误:', error)
      setRolesError('网络错误，无法获取角色列表')
    } finally {
      setLoadingRoles(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingUser ? '编辑用户' : '添加用户'}
          </h3>
          
          {rolesError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="text-sm">{rolesError}</p>
              <button
                type="button"
                onClick={fetchRoles}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                重新获取角色列表
              </button>
            </div>
          )}
          
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">用户名 *</label>
              <input
                type="text"
                value={userForm.username}
                onChange={(e) => onFormChange('username', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">角色 *</label>
              <select
                value={userForm.role}
                onChange={(e) => onFormChange('role', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={loadingRoles || rolesError}
              >
                {loadingRoles ? (
                  <option value="">加载中...</option>
                ) : rolesError ? (
                  <option value="">无法加载角色列表</option>
                ) : roles.length === 0 ? (
                  <option value="">暂无可用角色</option>
                ) : (
                  <>
                    <option value="">请选择角色</option>
                    {roles.map((role) => (
                      <option key={role.role_code} value={role.role_code}>
                        {role.role_name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                密码 {!editingUser && '*'}
              </label>
              <input
                type="password"
                value={userForm.password}
                onChange={(e) => onFormChange('password', e.target.value)}
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
                onChange={(e) => onFormChange('confirmPassword', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                required={!editingUser}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={loadingRoles || rolesError}
              >
                {editingUser ? '更新' : '创建'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UserForm