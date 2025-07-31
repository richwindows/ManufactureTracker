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
        setUser(data.user)
        setPermissions(data.user.permissions || [])
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
        setPermissions(data.user.permissions || [])
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

  // 检查权限
  const hasPermission = (permission) => {
    return permissions.includes(permission)
  }

  // 检查任一权限
  const hasAnyPermission = (permissionList) => {
    return permissionList.some(permission => permissions.includes(permission))
  }

  // 检查所有权限
  const hasAllPermissions = (permissionList) => {
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