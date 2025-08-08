import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'

// 重置用户密码
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
    const { newPassword } = await request.json()

    // 验证新密码
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: '新密码长度至少6位' },
        { status: 400 }
      )
    }

    // 获取用户信息
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('username, role')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 加密新密码
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // 更新用户密码
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('重置密码失败:', updateError)
      return NextResponse.json(
        { error: '重置密码失败' },
        { status: 500 }
      )
    }

    // 记录操作日志
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: authResult.user.id,
        action: 'reset_password',
        resource: 'users',
        resource_id: userId,
        details: { 
          username: user.username,
          reset_by: authResult.user.username
        }
      })

    return NextResponse.json({
      success: true,
      message: '密码重置成功'
    })

  } catch (error) {
    console.error('重置密码错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}