import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'

export async function POST(request) {
  try {
    // 验证用户权限
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    const { role } = await request.json()
    
    if (!role) {
      return NextResponse.json(
        { error: '缺少角色参数' },
        { status: 400 }
      )
    }

    console.log('测试权限函数，角色:', role)

    // 直接调用get_user_permissions函数
    const { data: permissions, error: permError } = await supabase
      .rpc('get_user_permissions', { user_role: role })

    console.log('权限函数返回结果:', { permissions, error: permError })

    if (permError) {
      console.error('权限函数调用失败:', permError)
      return NextResponse.json(
        { 
          error: '权限函数调用失败',
          details: permError,
          success: false
        },
        { status: 500 }
      )
    }

    // 同时测试权限表和角色权限表的数据
    const { data: allPermissions } = await supabase
      .from('permissions')
      .select('*')
      .order('id')

    const { data: rolePermissions } = await supabase
      .from('role_permissions')
      .select(`
        role_name,
        permissions (
          id,
          name,
          description,
          resource,
          action
        )
      `)
      .eq('role_name', role)

    return NextResponse.json({
      success: true,
      functionResult: permissions || [],
      functionError: permError,
      allPermissions: allPermissions || [],
      rolePermissions: rolePermissions || [],
      testRole: role
    })

  } catch (error) {
    console.error('测试权限函数错误:', error)
    return NextResponse.json(
      { 
        error: '服务器内部错误',
        details: error.message,
        success: false
      },
      { status: 500 }
    )
  }
}