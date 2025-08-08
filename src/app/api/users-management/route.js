import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'

// 获取用户列表
export async function GET(request) {
  try {
    // 验证用户管理读取权限
    const authResult = await verifyAuth(request, ['users.read'])
    if (!authResult.success) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const department = searchParams.get('department') || ''
    const isActive = searchParams.get('isActive')

    // 构建查询
    let query = supabase
      .from('users')
      .select(`
        id,
        username,
        role,
        is_active,
        last_login_at,
        created_at,
        updated_at
      `, { count: 'exact' })

    // 应用筛选条件
    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }
    
    if (role) {
      query = query.eq('role', role)
    }
    
    if (department) {
      query = query.ilike('department', `%${department}%`)
    }
    
    if (isActive !== null && isActive !== '') {
      query = query.eq('is_active', isActive === 'true')
    }

    // 应用分页
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('查询用户失败:', error)
      return NextResponse.json(
        { error: '查询用户失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      users: users || [],
      total: count || 0,
      page,
      limit
    })

  } catch (error) {
    console.error('获取用户列表错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 创建用户
export async function POST(request) {
  try {
    // 验证管理员权限
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    const { username, email, full_name, role, department, phone, password } = await request.json()

    // 验证必填字段
    if (!username || !email || !full_name || !password) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      )
    }

    // 验证角色
    if (!['admin', 'operator', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: '无效的角色' },
        { status: 400 }
      )
    }

    // 验证密码强度
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少6位' },
        { status: 400 }
      )
    }

    // 检查用户名是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 400 }
      )
    }

    // 检查邮箱是否已存在
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingEmail) {
      return NextResponse.json(
        { error: '邮箱已存在' },
        { status: 400 }
      )
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10)

    // 创建用户
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        username,
        email,
        full_name,
        role,
        department,
        phone,
        password_hash: passwordHash,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('创建用户失败:', error)
      return NextResponse.json(
        { error: '创建用户失败' },
        { status: 500 }
      )
    }

    // 记录操作日志
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: authResult.user.id,
        action: 'create_user',
        resource: 'users',
        resource_id: newUser.id,
        details: { created_username: username, created_role: role }
      })

    return NextResponse.json({
      success: true,
      message: '用户创建成功',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role
      }
    })

  } catch (error) {
    console.error('创建用户错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}