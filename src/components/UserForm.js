'use client'

function UserForm({ 
  show, 
  editingUser, 
  userForm, 
  onFormChange, 
  onSubmit, 
  onCancel 
}) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingUser ? '编辑用户' : '添加用户'}
          </h3>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">用户名 *</label>
              <input
                type="text"
                value={userForm.username}
                onChange={(e) => onFormChange('username', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">角色 *</label>
              <select
                value={userForm.role}
                onChange={(e) => onFormChange('role', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="viewer">查看者</option>
                <option value="operator">操作员</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">部门</label>
              <input
                type="text"
                value={userForm.department}
                onChange={(e) => onFormChange('department', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                密码 {!editingUser && '*'}
              </label>
              <input
                type="password"
                value={userForm.password}
                onChange={(e) => onFormChange('password', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                required={!editingUser}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                确认密码 {!editingUser && '*'}
              </label>
              <input
                type="password"
                value={userForm.confirmPassword}
                onChange={(e) => onFormChange('confirmPassword', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                required={!editingUser}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {editingUser ? '更新' : '创建'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UserForm