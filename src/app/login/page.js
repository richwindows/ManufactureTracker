'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/components/LoginForm'

const LoginPage = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 检查用户是否已登录
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          credentials: 'include' // 确保发送cookies
        })
        if (response.ok) {
          // 用户已登录，重定向到主页
          router.push('/')
          return
        }
      } catch (error) {
        console.log('用户未登录')
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLoginSuccess = () => {
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </div>
    </div>
  )
}

export default LoginPage