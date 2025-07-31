import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'

// 获取用户列表
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

    const { user } = authResult

    // 检查权限：只有管理员可以查看所有用户
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const isActive = searchParams.get('is_active')

    // 构建查询
    let query = supabase
      .from('users')
      .select('id, username, email, full_name, role, department, phone, is_active, last_login_at, created_at, updated_at', { count: 'exact' })

    // 添加搜索条件
    if (search) {
      query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (role) {
      query = query.eq('role', role)
    }

    if (isActive !== null && isActive !== '') {
      query = query.eq('is_active', isActive === 'true')
    }

    // 分页
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
    query = query.order('created_at', { ascending: false })

    const { data: users, error, count } = await query

    if (error) {
      console.error('获取用户列表失败:', error)
      return NextResponse.json(
        { error: '获取用户列表失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })

  } catch (error) {
    console.error('获取用户列表错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 创建新用户
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

    const { user: currentUser } = authResult

    // 检查权限：只有管理员可以创建用户
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const { username, email, password, fullName, role, department, phone } = await request.json()

    // 验证必填字段
    if (!username || !email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: '用户名、邮箱、密码、姓名和角色为必填项' },
        { status: 400 }
      )
    }

    // 验证角色
    if (!['admin', 'operator', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: '无效的用户角色' },
        { status: 400 }
      )
    }

    // 验证密码强度
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码至少需要6位字符' },
        { status: 400 }
      )
    }

    // 检查用户名和邮箱是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: '用户名或邮箱已存在' },
        { status: 409 }
      )
    }

    // 加密密码
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // 创建用户
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        username,
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role,
        department,
        phone
      })
      .select('id, username, email, full_name, role, department, phone, is_active, created_at')
      .single()

    if (createError) {
      console.error('创建用户失败:', createError)
      return NextResponse.json(
        { error: '创建用户失败' },
        { status: 500 }
      )
    }

    // 记录操作日志
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: currentUser.id,
        action: 'create_user',
        resource: 'users',
        resource_id: newUser.id,
        details: { created_user: { username, role, department } }
      })

    return NextResponse.json({
      success: true,
      user: newUser
    })

  } catch (error) {
    console.error('创建用户错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 更新用户
export async function PUT(request) {
  try {
    // 验证用户权限
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    const { user: currentUser } = authResult
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      )
    }

    // 检查权限：管理员可以更新所有用户，用户只能更新自己的信息
    if (currentUser.role !== 'admin' && currentUser.id !== parseInt(userId)) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const updateData = await request.json()
    const allowedFields = ['email', 'full_name', 'department', 'phone']
    
    // 管理员可以更新更多字段
    if (currentUser.role === 'admin') {
      allowedFields.push('role', 'is_active')
    }

    // 过滤允许更新的字段
    const filteredData = {}
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field]
      }
    }

    // 如果有密码更新
    if (updateData.password && updateData.password.length >= 6) {
      const saltRounds = 10
      filteredData.password_hash = await bcrypt.hash(updateData.password, saltRounds)
    }

    if (Object.keys(filteredData).length === 0) {
      return NextResponse.json(
        { error: '没有有效的更新字段' },
        { status: 400 }
      )
    }

    // 更新用户
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(filteredData)
      .eq('id', userId)
      .select('id, username, email, full_name, role, department, phone, is_active, updated_at')
      .single()

    if (updateError) {
      console.error('更新用户失败:', updateError)
      return NextResponse.json(
        { error: '更新用户失败' },
        { status: 500 }
      )
    }

    // 记录操作日志
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: currentUser.id,
        action: 'update_user',
        resource: 'users',
        resource_id: parseInt(userId),
        details: { updated_fields: Object.keys(filteredData) }
      })

    return NextResponse.json({
      success: true,
      user: updatedUser
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
export async function DELETE(request) {
  try {
    // 验证用户权限
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    const { user: currentUser } = authResult

    // 检查权限：只有管理员可以删除用户
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      )
    }

    // 不能删除自己
    if (currentUser.id === parseInt(userId)) {
      return NextResponse.json(
        { error: '不能删除自己的账户' },
        { status: 400 }
      )
    }

    // 获取要删除的用户信息
    const { data: userToDelete } = await supabase
      .from('users')
      .select('username, role')
      .eq('id', userId)
      .single()

    // 删除用户（软删除：设置为非活跃状态）
    const { error: deleteError } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)

    if (deleteError) {
      console.error('删除用户失败:', deleteError)
      return NextResponse.json(
        { error: '删除用户失败' },
        { status: 500 }
      )
    }

    // 删除用户的所有会话
    await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId)

    // 记录操作日志
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: currentUser.id,
        action: 'delete_user',
        resource: 'users',
        resource_id: parseInt(userId),
        details: { deleted_user: userToDelete }
      })

    return NextResponse.json({
      success: true,
      message: '用户已删除'
    })

  } catch (error) {
    console.error('删除用户错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}