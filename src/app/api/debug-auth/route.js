import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function GET(request) {
  try {
    // 获取token
    let token = null
    const cookies = request.headers.get('cookie')
    const authHeader = request.headers.get('authorization')
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookies) {
      const tokenMatch = cookies.match(/auth-token=([^;]+)/)
      if (tokenMatch) {
        token = tokenMatch[1]
      }
    }

    const debugInfo = {
      cookies: cookies || 'No cookies',
      authHeader: authHeader || null,
      token: token ? 'Token found' : 'No token',
      timestamp: new Date().toISOString()
    }

    if (!token) {
      return NextResponse.json({
        success: false,
        error: '未找到认证令牌',
        debug: debugInfo
      })
    }

    // 1. 验证JWT token格式
    let decoded = null
    try {
      decoded = jwt.verify(token, JWT_SECRET)
      debugInfo.jwtDecoded = {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        exp: new Date(decoded.exp * 1000).toISOString()
      }
    } catch (jwtError) {
      debugInfo.jwtError = jwtError.message
      return NextResponse.json({
        success: false,
        error: 'JWT token 无效',
        debug: debugInfo
      })
    }

    // 2. 检查数据库中的会话记录
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_token', token)
      .single()

    debugInfo.sessionQuery = {
      found: !!session,
      error: sessionError?.message || null,
      sessionData: session ? {
        id: session.id,
        user_id: session.user_id,
        expires_at: session.expires_at,
        created_at: session.created_at
      } : null
    }

    if (!session) {
      debugInfo.sessionStatus = '会话记录不存在'
    } else {
      // 3. 检查会话是否过期
      const now = new Date()
      const expiresAt = new Date(session.expires_at)
      debugInfo.sessionStatus = now > expiresAt ? '会话已过期' : '会话有效'
      debugInfo.timeCheck = {
        now: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isExpired: now > expiresAt
      }
    }

    // 4. 检查用户是否存在且激活
    if (decoded) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .eq('is_active', true)
        .single()

      debugInfo.userQuery = {
        found: !!user,
        error: userError?.message || null,
        userData: user ? {
          id: user.id,
          username: user.username,
          role: user.role,
          is_active: user.is_active
        } : null
      }
    }

    // 5. 调用完整的 verifyAuth 函数
    const authResult = await verifyAuth(request)
    debugInfo.authResult = authResult

    return NextResponse.json({
      success: true,
      debug: debugInfo
    })

  } catch (error) {
    console.error('调试认证错误:', error)
    return NextResponse.json({
      success: false,
      error: '调试过程中发生错误',
      debug: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    })
  }
}