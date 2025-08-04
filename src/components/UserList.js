'use client'

function UserList({ 
  users, 
  loading, 
  onEditUser, 
  onToggleUserStatus, 
  onResetPassword, 
  onDeleteUser,
  onOpenPermissions 
}) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              用户信息
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              角色
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              部门
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              状态
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              最后登录
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((userData) => (
            <tr key={userData.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {userData.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {userData.username} • {userData.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  userData.role === 'admin' ? 'bg-red-100 text-red-800' :
                  userData.role === 'operator' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {userData.role === 'admin' ? '管理员' :
                   userData.role === 'operator' ? '操作员' : '查看者'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {userData.department || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  userData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {userData.is_active ? '启用' : '禁用'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {userData.last_login_at ? 
                  new Date(userData.last_login_at).toLocaleString() : 
                  '从未登录'
                }
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  onClick={() => onEditUser(userData)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  编辑
                </button>
                <button
                  onClick={() => onOpenPermissions(userData.id)}
                  className="text-purple-600 hover:text-purple-900"
                >
                  权限
                </button>
                <button
                  onClick={() => onToggleUserStatus(userData.id, userData.is_active)}
                  className={userData.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                >
                  {userData.is_active ? '禁用' : '启用'}
                </button>
                <button
                  onClick={() => onResetPassword(userData.id, userData.username)}
                  className="text-yellow-600 hover:text-yellow-900"
                >
                  重置密码
                </button>
                {userData.username !== 'admin' && (
                  <button
                    onClick={() => onDeleteUser(userData.id, userData.username)}
                    className="text-red-600 hover:text-red-900"
                  >
                    删除
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {users.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500">暂无用户数据</div>
        </div>
      )}
    </div>
  )
}

export default UserList