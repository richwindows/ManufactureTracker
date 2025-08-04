import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'

// 更新用户
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
    const { email, full_name, role, department, phone, password } = await request.json()

    // 验证必填字段
    if (!email || !full_name) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      )
    }

    // 验证角色
    if (role && !['admin', 'operator', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: '无效的角色' },
        { status: 400 }
      )
    }

    // 构建更新数据
    const updateData = {
      email,
      full_name,
      role,
      department,
      phone,
      updated_at: new Date().toISOString()
    }

    // 如果提供了新密码，加密并添加到更新数据中
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: '密码长度至少6位' },
          { status: 400 }
        )
      }
      updateData.password_hash = await bcrypt.hash(password, 10)
    }

    // 更新用户
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('更新用户失败:', error)
      return NextResponse.json(
        { error: '更新用户失败' },
        { status: 500 }
      )
    }

    // 记录操作日志
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: authResult.user.id,
        action: 'update_user',
        resource: 'users',
        resource_id: userId,
        details: { updated_fields: Object.keys(updateData) }
      })

    return NextResponse.json({
      success: true,
      message: '用户更新成功',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        role: updatedUser.role
      }
    })

  } catch (error) {
    console.error('更新用户错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 删除用户
export async function DELETE(request, { params }) {
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

    // 检查是否为默认管理员用户
    const { data: user } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .single()

    if (user?.username === 'admin') {
      return NextResponse.json(
        { error: '不能删除默认管理员用户' },
        { status: 400 }
      )
    }

    // 删除用户
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('删除用户失败:', error)
      return NextResponse.json(
        { error: '删除用户失败' },
        { status: 500 }
      )
    }

    // 记录操作日志
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: authResult.user.id,
        action: 'delete_user',
        resource: 'users',
        resource_id: userId,
        details: { deleted_username: user?.username }
      })

    return NextResponse.json({
      success: true,
      message: '用户删除成功'
    })

  } catch (error) {
    console.error('删除用户错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}