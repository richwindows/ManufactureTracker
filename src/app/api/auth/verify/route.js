import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

export async function GET(request) {
  try {
    // 从cookie或Authorization header获取token
    const cookieToken = request.cookies.get('auth-token')?.value
    const authHeader = request.headers.get('authorization')
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    
    const token = cookieToken || headerToken

    if (!token) {
      return NextResponse.json(
        { error: '未找到认证令牌', authenticated: false },
        { status: 401 }
      )
    }

    try {
      // 验证JWT token
      const decoded = jwt.verify(token, JWT_SECRET)
      
      // 检查会话是否存在且未过期
      const { data: session, error: sessionError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', token)
        .eq('user_id', decoded.userId)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (sessionError || !session) {
        return NextResponse.json(
          { error: '会话已过期或无效', authenticated: false },
          { status: 401 }
        )
      }

      // 获取最新的用户信息
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .eq('is_active', true)
        .single()

      if (userError || !user) {
        return NextResponse.json(
          { error: '用户不存在或已被禁用', authenticated: false },
          { status: 401 }
        )
      }

      // 获取用户权限
      const { data: permissions } = await supabase
        .rpc('get_user_permissions', { user_role: user.role })

      // 返回用户信息
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          department: user.department,
          permissions: permissions || []
        },
        session: {
          expiresAt: session.expires_at,
          ipAddress: session.ip_address
        }
      })

    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Token无效', authenticated: false },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('验证错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误', authenticated: false },
      { status: 500 }
    )
  }
}

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}