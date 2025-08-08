import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    
    // 验证管理员权限
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 获取用户信息
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', parseInt(id))
      .single()

    if (userError) {
      console.error('获取用户信息失败:', userError)
      throw userError
    }

    // 获取所有模块权限
    const { data: allPermissions, error: permError } = await supabase
      .from('permissions')
      .select('id, name, description, resource, action')
      .like('name', 'module.%')
      .order('name')

    if (permError) {
      console.error('获取权限列表失败:', permError)
      throw permError
    }

    // 获取该角色的权限
    const { data: rolePermissions, error: rolePermError } = await supabase
      .from('role_permissions')
      .select('permission_id')
      .eq('role', user.role)

    if (rolePermError) {
      console.error('获取角色权限失败:', rolePermError)
      throw rolePermError
    }

    const rolePermissionIds = rolePermissions.map(rp => rp.permission_id)

    // 格式化权限数据
    const formattedPermissions = allPermissions.map(permission => ({
      permission_id: permission.id,
      granted: rolePermissionIds.includes(permission.id),
      name: permission.name,
      description: permission.description,
      resource: permission.resource,
      action: permission.action
    }))

    return NextResponse.json({
      success: true,
      permissions: formattedPermissions,
      userRole: user.role
    })

  } catch (error) {
    console.error('获取用户权限失败:', error)
    return NextResponse.json(
      { error: '获取用户权限失败' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const { permissions } = await request.json()
    
    // 验证管理员权限
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 获取用户角色
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', parseInt(id))
      .single()

    if (userError) {
      console.error('获取用户信息失败:', userError)
      throw userError
    }

    // 获取所有模块权限的ID
    const { data: modulePermissions, error: modulePermError } = await supabase
      .from('permissions')
      .select('id')
      .like('name', 'module.%')

    if (modulePermError) {
      console.error('获取模块权限失败:', modulePermError)
      throw modulePermError
    }

    const modulePermissionIds = modulePermissions.map(p => p.id)

    // 删除该角色现有的模块权限
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role', user.role)
      .in('permission_id', modulePermissionIds)

    if (deleteError) {
      console.error('删除现有权限失败:', deleteError)
      throw deleteError
    }

    // 插入新的权限设置（只插入granted为true的权限）
    const grantedPermissions = permissions.filter(perm => perm.granted)
    
    if (grantedPermissions.length > 0) {
      const permissionRecords = grantedPermissions.map(perm => ({
        role: user.role,
        permission_id: perm.permission_id,
        created_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert(permissionRecords)

      if (insertError) {
        console.error('插入新权限失败:', insertError)
        throw insertError
      }
    }

    return NextResponse.json({
      success: true,
      message: '用户权限更新成功'
    })

  } catch (error) {
    console.error('更新用户权限失败:', error)
    return NextResponse.json(
      { error: '更新用户权限失败' },
      { status: 500 }
    )
  }
}