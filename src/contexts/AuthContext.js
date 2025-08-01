'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState([])
  const router = useRouter()

  // 检查用户认证状态
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        credentials: 'include' // 确保发送cookies
      })
      if (response.ok) {
        const data = await response.json()
        console.log('认证数据:', data) // 调试日志
        setUser(data.user)
        
        // 修复权限设置逻辑
        let userPermissions = []
        if (data.user.permissions) {
          if (Array.isArray(data.user.permissions)) {
            // 如果是字符串数组，直接使用
            if (typeof data.user.permissions[0] === 'string') {
              userPermissions = data.user.permissions
            } 
            // 如果是对象数组，提取权限名称
            else if (typeof data.user.permissions[0] === 'object') {
              userPermissions = data.user.permissions.map(p => 
                p.permission_name || p.name || p
              )
            }
          }
        }
        
        console.log('处理后的权限:', userPermissions) // 调试日志
        setPermissions(userPermissions)
      } else {
        setUser(null)
        setPermissions([])
      }
    } catch (error) {
      console.error('认证检查失败:', error)
      setUser(null)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  // 登录
  const login = async (username, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // 确保接收cookies
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        
        // 修复权限设置逻辑
        let userPermissions = []
        if (data.user.permissions) {
          if (Array.isArray(data.user.permissions)) {
            if (typeof data.user.permissions[0] === 'string') {
              userPermissions = data.user.permissions
            } else if (typeof data.user.permissions[0] === 'object') {
              userPermissions = data.user.permissions.map(p => 
                p.permission_name || p.name || p
              )
            }
          }
        }
        
        setPermissions(userPermissions)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: '网络错误' }
    }
  }

  // 登出
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // 确保发送cookies
      })
    } catch (error) {
      console.error('登出请求失败:', error)
    } finally {
      setUser(null)
      setPermissions([])
      router.push('/login')
    }
  }

  // 检查权限 - 增强版本
  const hasPermission = (permission) => {
    console.log(`检查权限 ${permission}:`, {
      permissions,
      hasIt: permissions.includes(permission),
      userRole: user?.role
    })
    
    // 如果是管理员，拥有所有权限
    if (user?.role === 'admin') {
      return true
    }
    
    return permissions.includes(permission)
  }

  // 检查任一权限
  const hasAnyPermission = (permissionList) => {
    if (user?.role === 'admin') {
      return true
    }
    return permissionList.some(permission => permissions.includes(permission))
  }

  // 检查所有权限
  const hasAllPermissions = (permissionList) => {
    if (user?.role === 'admin') {
      return true
    }
    return permissionList.every(permission => permissions.includes(permission))
  }

  // 检查角色
  const hasRole = (role) => {
    return user?.role === role
  }

  // 检查任一角色
  const hasAnyRole = (roleList) => {
    return roleList.includes(user?.role)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const value = {
    user,
    permissions,
    loading,
    login,
    logout,
    checkAuth,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isOperator: user?.role === 'operator',
    isViewer: user?.role === 'viewer'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext