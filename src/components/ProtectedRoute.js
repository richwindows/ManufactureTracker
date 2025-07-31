'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const ProtectedRoute = ({ 
  children, 
  requiredPermissions = [], 
  requiredRoles = [], 
  requireAuth = true,
  fallback = null 
}) => {
  const { user, loading, permissions, hasAnyPermission, hasAnyRole, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // 如果需要认证但用户未登录
    if (requireAuth && !isAuthenticated) {
      router.push('/login')
      return
    }

    // 如果需要特定权限但用户没有
    if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
      router.push('/unauthorized')
      return
    }

    // 如果需要特定角色但用户没有
    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
      router.push('/unauthorized')
      return
    }
  }, [loading, isAuthenticated, permissions, user, router, requireAuth, requiredPermissions, requiredRoles])

  // 加载中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 需要认证但未登录
  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">正在跳转到登录页面...</p>
        </div>
      </div>
    )
  }

  // 权限不足
  if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">权限不足，正在跳转...</p>
        </div>
      </div>
    )
  }

  // 角色不符
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">角色权限不足，正在跳转...</p>
        </div>
      </div>
    )
  }

  return children
}

// 权限检查组件（不重定向，只显示/隐藏内容）
export const PermissionGuard = ({ 
  children, 
  requiredPermissions = [], 
  requiredRoles = [], 
  fallback = null,
  requireAll = false // 是否需要所有权限/角色
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole } = useAuth()

  // 检查权限
  let hasRequiredPermissions = true
  if (requiredPermissions.length > 0) {
    if (requireAll) {
      hasRequiredPermissions = hasAllPermissions(requiredPermissions)
    } else {
      hasRequiredPermissions = hasAnyPermission(requiredPermissions)
    }
  }

  // 检查角色
  let hasRequiredRoles = true
  if (requiredRoles.length > 0) {
    if (requireAll) {
      hasRequiredRoles = requiredRoles.every(role => hasRole(role))
    } else {
      hasRequiredRoles = hasAnyRole(requiredRoles)
    }
  }

  if (hasRequiredPermissions && hasRequiredRoles) {
    return children
  }

  return fallback
}

// 角色检查组件
export const RoleGuard = ({ children, allowedRoles = [], fallback = null }) => {
  return (
    <PermissionGuard 
      requiredRoles={allowedRoles} 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

// 管理员专用组件
export const AdminOnly = ({ children, fallback = null }) => {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

// 操作员及以上权限组件
export const OperatorAndAbove = ({ children, fallback = null }) => {
  return (
    <RoleGuard allowedRoles={['admin', 'operator']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export default ProtectedRoute