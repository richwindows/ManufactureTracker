'use client'

function UserFilters({ filters, onFilterChange }) {
  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-3">筛选条件</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="搜索用户名、邮箱或姓名"
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="px-3 py-2 border rounded-md"
        />
        <select
          value={filters.role}
          onChange={(e) => onFilterChange('role', e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">所有角色</option>
          <option value="admin">管理员</option>
          <option value="operator">操作员</option>
          <option value="viewer">查看者</option>
        </select>
        <input
          type="text"
          placeholder="部门"
          value={filters.department}
          onChange={(e) => onFilterChange('department', e.target.value)}
          className="px-3 py-2 border rounded-md"
        />
        <select
          value={filters.isActive}
          onChange={(e) => onFilterChange('isActive', e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">所有状态</option>
          <option value="true">启用</option>
          <option value="false">禁用</option>
        </select>
      </div>
    </div>
  )
}

export default UserFilters