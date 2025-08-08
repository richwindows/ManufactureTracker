import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'

// 切换用户状态
export async function PUT(request, { params }) {
  try {
    // 验证管理员权限
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const userId = params.id
    const { isActive } = await request.json()

    // 检查是否为默认管理员用户
    const { data: user } = await supabase
      .from('users')
      .select('username, is_active')
      .eq('id', userId)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    if (user.username === 'admin' && !isActive) {
      return NextResponse.json(
        { error: '不能禁用默认管理员用户' },
        { status: 400 }
      )
    }

    // 更新用户状态
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, username, is_active')
      .single()

    if (error) {
      console.error('切换用户状态失败:', error)
      return NextResponse.json(
        { error: '切换用户状态失败' },
        { status: 500 }
      )
    }

    // 记录操作日志
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: authResult.user.id,
        action: 'toggle_user_status',
        resource: 'users',
        resource_id: userId,
        details: { 
          username: user.username,
          old_status: user.is_active,
          new_status: isActive
        }
      })

    return NextResponse.json({
      success: true,
      message: `用户状态${isActive ? '启用' : '禁用'}成功`,
      user: updatedUser
    })

  } catch (error) {
    console.error('切换用户状态错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}