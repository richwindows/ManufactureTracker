'use client'

import { PermissionGuard } from '@/components/ProtectedRoute'

// 模块权限常量
export const MODULE_PERMISSIONS = {
  COUNTING_WINDOWS: 'module.counting_windows',
  BULK_IMPORT: 'module.bulk_import',
  USER_MANAGEMENT: 'module.user_management',
  STATUS_STATS: 'module.status_stats',
  PRODUCT_SYNC: 'module.product_sync',
  SEARCH_FILTER: 'module.search_filter',
  PRODUCT_LIST: 'module.product_list'
}

// 模块权限描述映射
export const MODULE_DESCRIPTIONS = {
  [MODULE_PERMISSIONS.COUNTING_WINDOWS]: '计数窗口模块',
  [MODULE_PERMISSIONS.BULK_IMPORT]: '批量导入模块',
  [MODULE_PERMISSIONS.USER_MANAGEMENT]: '用户管理模块',
  [MODULE_PERMISSIONS.STATUS_STATS]: '状态统计模块',
  [MODULE_PERMISSIONS.PRODUCT_SYNC]: '产品同步模块',
  [MODULE_PERMISSIONS.SEARCH_FILTER]: '搜索过滤模块',
  [MODULE_PERMISSIONS.PRODUCT_LIST]: '产品列表模块'
}

// 默认的权限不足提示组件
const DefaultPermissionFallback = ({ moduleName }) => (
  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
    <div className="text-gray-500 text-sm">
      <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9-7a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      您没有访问 {moduleName} 的权限
    </div>
  </div>
)

// 模块权限守卫组件
const ModulePermissionGuard = ({ 
  children, 
  modulePermission, 
  fallback = null,
  showFallback = false, // 是否显示默认的权限不足提示
  debug = false // 调试模式
}) => {
  // 如果没有指定模块权限，直接显示内容
  if (!modulePermission) {
    if (debug) {
      console.warn('ModulePermissionGuard: 未指定模块权限，直接显示内容')
    }
    return children
  }

  // 验证权限名称是否有效
  const isValidPermission = Object.values(MODULE_PERMISSIONS).includes(modulePermission)
  if (!isValidPermission && debug) {
    console.warn(`ModulePermissionGuard: 无效的模块权限 "${modulePermission}"`)
  }

  // 确定要使用的fallback
  let finalFallback = fallback
  if (showFallback && !fallback) {
    const moduleName = MODULE_DESCRIPTIONS[modulePermission] || modulePermission
    finalFallback = <DefaultPermissionFallback moduleName={moduleName} />
  }

  if (debug) {
    console.log(`ModulePermissionGuard: 检查权限 "${modulePermission}"`, {
      modulePermission,
      isValidPermission,
      hasFallback: !!finalFallback,
      showFallback
    })
  }

  // 使用 PermissionGuard 检查模块权限
  return (
    <PermissionGuard 
      requiredPermissions={[modulePermission]} 
      fallback={finalFallback}
    >
      {children}
    </PermissionGuard>
  )
}

// 便捷的模块权限检查Hook（可选）
export const useModulePermission = (modulePermission) => {
  const { hasPermission } = useAuth()
  return hasPermission(modulePermission)
}

export default ModulePermissionGuard