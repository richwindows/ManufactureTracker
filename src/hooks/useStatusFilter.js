'use client'

import { useAuth } from '@/contexts/AuthContext'
import { STATUS_PERMISSION_MAP } from '@/components/ModulePermissionGuard'

export const useStatusFilter = () => {
  const { hasPermission, user } = useAuth()

  // 检查用户是否有查看特定状态的权限
  const canViewStatus = (status) => {
    // 管理员可以查看所有状态
    if (user?.role === 'admin') {
      return true
    }

    // 获取状态对应的权限
    const permission = STATUS_PERMISSION_MAP[status]
    if (!permission) {
      // 如果没有定义权限，默认允许查看
      return true
    }

    return hasPermission(permission)
  }

  // 过滤状态组，只返回用户有权限查看的状态
  const filterStatusGroups = (statusGroups) => {
    const filteredGroups = {}
    
    Object.keys(statusGroups).forEach(status => {
      if (canViewStatus(status)) {
        filteredGroups[status] = statusGroups[status]
      }
    })
    
    return filteredGroups
  }

  // 获取用户可以查看的状态列表
  const getViewableStatuses = () => {
    const allStatuses = ['scheduled', '已切割', '已清角', '已入库', '部分出库', '已出库', '已扫描']
    return allStatuses.filter(status => canViewStatus(status))
  }

  return {
    canViewStatus,
    filterStatusGroups,
    getViewableStatuses
  }
}