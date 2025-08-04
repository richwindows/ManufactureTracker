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

    // 获取用户特定权限设置
    const { data: userPermissions, error: userPermError } = await supabase
      .from('user_permissions')
      .select(`
        permission_id,
        granted,
        permissions!inner(
          id,
          name,
          description,
          resource,
          action
        )
      `)
      .eq('user_id', parseInt(id))

    if (userPermError) {
      console.error('获取用户权限失败:', userPermError)
      throw userPermError
    }

    // 格式化权限数据
    const formattedPermissions = (userPermissions || []).map(up => ({
      permission_id: up.permission_id,
      granted: up.granted,
      name: up.permissions.name,
      description: up.permissions.description,
      resource: up.permissions.resource,
      action: up.permissions.action
    }))

    return NextResponse.json({
      success: true,
      permissions: formattedPermissions
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

    // 删除用户现有的特定权限
    const { error: deleteError } = await supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', parseInt(id))

    if (deleteError) {
      console.error('删除现有权限失败:', deleteError)
      throw deleteError
    }

    // 插入新的权限设置
    if (permissions && permissions.length > 0) {
      const permissionRecords = permissions.map(perm => ({
        user_id: parseInt(id),
        permission_id: perm.permission_id,
        granted: perm.granted,
        granted_by: authResult.user.id,
        granted_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabase
        .from('user_permissions')
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