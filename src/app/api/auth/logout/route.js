import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    // 获取Authorization header中的token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
      // 删除数据库中的会话记录
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .delete()
        .eq('session_token', token)

      if (sessionError) {
        console.error('删除会话记录失败:', sessionError)
        // 不阻止登出，只记录错误
      }

      // 如果能解析token，记录登出活动
      try {
        const jwt = require('jsonwebtoken')
        const decoded = jwt.decode(token)
        if (decoded?.userId) {
          // 获取客户端信息
          const userAgent = request.headers.get('user-agent') || ''
          const forwardedFor = request.headers.get('x-forwarded-for')
          const realIp = request.headers.get('x-real-ip')
          const ipAddress = forwardedFor?.split(',')[0] || realIp || '127.0.0.1'

          // 记录登出活动
          await supabase
            .from('user_activity_logs')
            .insert({
              user_id: decoded.userId,
              action: 'logout',
              resource: 'auth',
              details: { ip_address: ipAddress, user_agent: userAgent },
              ip_address: ipAddress,
              user_agent: userAgent
            })
        }
      } catch (tokenError) {
        console.error('解析token失败:', tokenError)
        // 继续执行登出流程
      }
    }

    // 创建响应并清除cookie
    const response = NextResponse.json({
      success: true,
      message: '登出成功'
    })

    // 清除HTTP-only cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // 立即过期
      expires: new Date(0) // 设置为过去的时间
    })

    return response

  } catch (error) {
    console.error('登出错误:', error)
    
    // 即使出错也要清除cookie
    const response = NextResponse.json(
      { error: '登出过程中发生错误，但已清除本地会话' },
      { status: 500 }
    )

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      expires: new Date(0)
    })

    return response
  }
}

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}