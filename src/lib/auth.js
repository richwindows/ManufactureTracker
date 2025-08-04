import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-barcode-system-2024'

// 验证用户认证和权限
export async function verifyAuth(request, requiredPermissions = []) {
  try {
    // 从cookie或Authorization header获取token
    let token = null
    
    // 首先尝试从Authorization header获取
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    
    // 如果没有Authorization header，尝试从cookie获取
    if (!token) {
      const cookies = request.headers.get('cookie')
      if (cookies) {
        const tokenMatch = cookies.match(/auth-token=([^;]+)/)
        if (tokenMatch) {
          token = tokenMatch[1]
        }
      }
    }

    if (!token) {
      return {
        success: false,
        error: '未找到认证令牌'
      }
    }

    // 验证JWT token
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (jwtError) {
      return {
        success: false,
        error: '无效的认证令牌'
      }
    }

    // 检查会话是否存在且有效
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_token', token)
      .single()

    if (sessionError || !session) {
      return {
        success: false,
        error: '会话已过期或无效'
      }
    }

    // 检查会话是否过期
    const now = new Date()
    const expiresAt = new Date(session.expires_at)
    
    if (now > expiresAt) {
      // 删除过期会话
      await supabase
        .from('user_sessions')
        .delete()
        .eq('id', session.id)

      return {
        success: false,
        error: '会话已过期'
      }
    }

    // 获取用户信息
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      return {
        success: false,
        error: '用户不存在或已被禁用'
      }
    }

    // 获取用户权限 - 修复函数调用
    const { data: permissions, error: permError } = await supabase
      .rpc('get_user_permissions', { user_role: user.role })

    if (permError) {
      console.error('获取用户权限失败:', permError)
      return {
        success: false,
        error: '获取用户权限失败'
      }
    }

    // 检查所需权限
    if (requiredPermissions.length > 0) {
      const userPermissions = permissions?.map(p => p.permission_name || p.name) || []
      const hasAllPermissions = requiredPermissions.every(perm => 
        userPermissions.includes(perm)
      )

      if (!hasAllPermissions) {
        return {
          success: false,
          error: '权限不足'
        }
      }
    }

    return {
      success: true,
      user: {
        ...user,
        permissions: permissions?.map(p => p.permission_name || p.name) || []
      },
      session
    }

  } catch (error) {
    console.error('认证验证错误:', error)
    return {
      success: false,
      error: '认证验证失败'
    }
  }
}

// 检查用户是否有特定权限
export function hasPermission(userPermissions, requiredPermission) {
  return userPermissions.includes(requiredPermission)
}

// 检查用户是否有任一权限
export function hasAnyPermission(userPermissions, requiredPermissions) {
  return requiredPermissions.some(perm => userPermissions.includes(perm))
}

// 检查用户是否有所有权限
export function hasAllPermissions(userPermissions, requiredPermissions) {
  return requiredPermissions.every(perm => userPermissions.includes(perm))
}

// 生成JWT token
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

// 验证JWT token（不检查数据库）
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// 权限常量 - 添加 shipping 相关权限
export const PERMISSIONS = {
  // 产品管理
  PRODUCTS_VIEW: 'products:view',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  PRODUCTS_BULK_IMPORT: 'products:bulk_import',
  PRODUCTS_EXPORT: 'products:export',
  PRODUCTS_SEARCH: 'products:search',
  PRODUCTS_SHIPPING: 'products:shipping',
  PRODUCTS_PARTIAL_SHIPPING: 'products:partial_shipping',
  
  // 条码管理
  BARCODES_VIEW: 'barcodes:view',
  BARCODES_CREATE: 'barcodes:create',
  BARCODES_UPDATE: 'barcodes:update',
  BARCODES_DELETE: 'barcodes:delete',
  
  // 扫描管理
  SCANS_VIEW: 'scans:view',
  SCANS_CREATE: 'scans:create',
  SCANS_DELETE: 'scans:delete',
  
  // 统计报告
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  STATS_READ: 'stats:read',
  STATS_EXPORT: 'stats:export',
  
  // 用户管理
  USERS_VIEW: 'users:view',
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  
  // 系统管理
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_LOGS: 'system:logs',
  SYSTEM_BACKUP: 'system:backup'
}

// 角色权限映射 - 添加 shipping_receiving 角色
export const ROLE_PERMISSIONS = {
  admin: [
    // 所有权限
    ...Object.values(PERMISSIONS)
  ],
  operator: [
    // 产品管理（除删除）
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_BULK_IMPORT,
    PERMISSIONS.PRODUCTS_EXPORT,
    PERMISSIONS.PRODUCTS_SEARCH,
    
    // 条码管理
    PERMISSIONS.BARCODES_VIEW,
    PERMISSIONS.BARCODES_CREATE,
    PERMISSIONS.BARCODES_UPDATE,
    
    // 扫描管理
    PERMISSIONS.SCANS_VIEW,
    PERMISSIONS.SCANS_CREATE,
    
    // 统计报告
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT
  ],
  viewer: [
    // 只读权限
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.BARCODES_VIEW,
    PERMISSIONS.SCANS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.PRODUCTS_SEARCH
  ],
  shipping_receiving: [
    // 出货相关权限
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_SEARCH,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_SHIPPING,
    PERMISSIONS.PRODUCTS_PARTIAL_SHIPPING
  ]
}