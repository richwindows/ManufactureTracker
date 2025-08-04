import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'

export async function GET(request) {
  try {
    // 验证管理员权限
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 获取所有权限，按资源分组
    const { data: permissions, error } = await supabase
      .from('permissions')
      .select('*')
      .order('resource, action')

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      permissions: permissions || []
    })

  } catch (error) {
    console.error('获取权限列表失败:', error)
    return NextResponse.json(
      { error: '获取权限列表失败' },
      { status: 500 }
    )
  }
}