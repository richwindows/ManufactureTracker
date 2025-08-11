'use client'

import { useMemo, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { STATUS_PERMISSION_MAP } from '@/components/ModulePermissionGuard'

export const useStatusFilter = () => {
  const { hasPermission, user } = useAuth()
  const loggedRef = useRef(false) // 用于控制日志只输出一次

  // 使用 useMemo 预计算用户的状态权限映射，避免重复检查
  const userStatusPermissions = useMemo(() => {
    if (!user) return {}

    if (user.role === 'admin') {
      // 管理员拥有所有权限
      const allStatuses = ['scheduled', '已排产', '已切割', '已清角', '已入库', '部分出库', '已出库', '已扫描']
      const adminPermissions = Object.fromEntries(allStatuses.map(status => [status, true]))
      
      // 只在第一次或用户变化时输出日志
      if (!loggedRef.current || loggedRef.current !== user.username) {
        console.log(`🔐 管理员 ${user.username} 拥有所有状态权限`)
        loggedRef.current = user.username
      }
      
      return adminPermissions
    }

    const statusPermissions = {}
    Object.keys(STATUS_PERMISSION_MAP).forEach(status => {
      const permission = STATUS_PERMISSION_MAP[status]
      statusPermissions[status] = permission ? hasPermission(permission) : false
    })

    // 只在第一次或用户变化时输出日志
    if (!loggedRef.current || loggedRef.current !== user.username) {
      const viewableStatuses = Object.keys(statusPermissions).filter(status => statusPermissions[status])
      console.log(`🔐 用户 ${user.username} (${user.role}) 可查看的状态:`, viewableStatuses)
      loggedRef.current = user.username
    }

    return statusPermissions
  }, [user?.username, user?.role, hasPermission]) // 移除 permissions 依赖

  // 使用 useCallback 缓存权限检查函数
  const canViewStatus = useCallback((status) => {
    return userStatusPermissions[status] || false
  }, [userStatusPermissions])

  // 使用 useMemo 缓存可查看的状态列表
  const viewableStatuses = useMemo(() => {
    return Object.keys(userStatusPermissions).filter(status => 
      userStatusPermissions[status]
    )
  }, [userStatusPermissions])

  // 使用 useCallback 缓存过滤函数
  const filterStatusGroups = useCallback((statusGroups) => {
    // 如果没有状态组，直接返回
    if (!statusGroups || Object.keys(statusGroups).length === 0) {
      return {}
    }
    
    const filteredGroups = {}
    
    Object.keys(statusGroups).forEach(status => {
      if (canViewStatus(status)) {
        filteredGroups[status] = statusGroups[status]
      }
    })
    
    // 只在有过滤结果时输出简化日志
    const originalCount = Object.keys(statusGroups).length
    const filteredCount = Object.keys(filteredGroups).length
    
    if (originalCount > 0) {
      console.log(`📊 状态过滤: ${originalCount} → ${filteredCount} (用户: ${user?.username})`)
    }
    
    return filteredGroups
  }, [user?.username, canViewStatus])

  // 使用 useCallback 缓存 getViewableStatuses 函数
  const getViewableStatuses = useCallback(() => {
    return viewableStatuses
  }, [viewableStatuses])

  return {
    canViewStatus,
    filterStatusGroups,
    getViewableStatuses
  }
}