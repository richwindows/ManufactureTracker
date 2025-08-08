import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'

// 获取角色列表
export async function GET(request) {
  try {
    // 验证用户权限
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    // 调用数据库函数获取角色列表
    const { data: roles, error } = await supabase
      .rpc('get_user_roles')

    if (error) {
      console.error('获取角色列表失败:', error)
      return NextResponse.json(
        { error: '获取角色列表失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      roles: roles || []
    })

  } catch (error) {
    console.error('获取角色列表错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}