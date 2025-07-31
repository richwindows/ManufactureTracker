'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { FiShield, FiHome, FiLogOut } from 'react-icons/fi'

const UnauthorizedPage = () => {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleGoHome = () => {
    router.push('/')
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-24 w-24 text-red-500 mb-6">
            <FiShield className="h-full w-full" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            访问被拒绝
          </h2>
          <p className="text-gray-600 mb-8">
            抱歉，您没有权限访问此页面。
          </p>
        </div>

        {user && (
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">当前用户信息</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>用户名:</span>
                <span className="font-medium">{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span>姓名:</span>
                <span className="font-medium">{user.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span>角色:</span>
                <span className="font-medium">
                  {user.role === 'admin' && '管理员'}
                  {user.role === 'operator' && '操作员'}
                  {user.role === 'viewer' && '查看者'}
                </span>
              </div>
              {user.department && (
                <div className="flex justify-between">
                  <span>部门:</span>
                  <span className="font-medium">{user.department}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            如果您认为这是一个错误，请联系系统管理员。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleGoHome}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiHome className="mr-2" />
              返回首页
            </button>
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiLogOut className="mr-2" />
              重新登录
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            条码状态管理系统 - 权限管理
          </p>
        </div>
      </div>
    </div>
  )
}

export default UnauthorizedPage