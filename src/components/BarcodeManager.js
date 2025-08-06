'use client';

import { useState, useEffect, useRef } from 'react';

export default function BarcodeManager({ onBarcodeAdded }) {
  const [barcode, setBarcode] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('已切割'); // 默认状态
  const [recentBarcodes, setRecentBarcodes] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // 可选择的状态列表
  const statusOptions = [
    '已切割',
    '已清角', 
    '已入库',
    '部分出库',
    '已出库'
  ];

  useEffect(() => {
    // 设置默认日期为今天
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    
    // 加载最近的条码记录
    fetchRecentBarcodes();
    
    // 聚焦到输入框
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 获取最近的条码记录
  const fetchRecentBarcodes = async () => {
    try {
      const response = await fetch('/api/barcodes?action=recent&limit=10');
      const data = await response.json();
      setRecentBarcodes(data);
    } catch (error) {
      console.error('Error fetching recent barcodes:', error);
    }
  };

  // 添加条码
  const addBarcode = async (e) => {
    e.preventDefault();
    
    if (!barcode.trim()) {
      showMessage('error', '请输入条码');
      return;
    }

    if (!selectedStatus) {
      showMessage('error', '请选择状态');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/barcodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          barcode: barcode.trim(),
          status: selectedStatus
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', `条码添加成功！状态: ${selectedStatus}`);
        setBarcode('');
        fetchRecentBarcodes();
        if (onBarcodeAdded) {
          onBarcodeAdded();
        }
        // 重新聚焦到输入框
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } else {
        showMessage('error', data.error || '添加失败');
      }
    } catch (error) {
      console.error('Error adding barcode:', error);
      showMessage('error', '网络错误');
    } finally {
      setLoading(false);
    }
  };

  // 显示消息
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // 查询单日数量
  const queryDateCount = async () => {
    if (!selectedDate) {
      showMessage('error', '请选择日期');
      return;
    }

    try {
      const response = await fetch(`/api/barcodes?action=date-count&date=${selectedDate}`);
      const data = await response.json();
      showMessage('info', `${selectedDate} 的扫描数量: ${data.count}`);
    } catch (error) {
      console.error('Error querying date count:', error);
      showMessage('error', '查询失败');
    }
  };

  // 查询日期范围数量
  const queryRangeCount = async () => {
    if (!startDate || !endDate) {
      showMessage('error', '请选择开始和结束日期');
      return;
    }

    if (startDate > endDate) {
      showMessage('error', '开始日期不能晚于结束日期');
      return;
    }

    try {
      const response = await fetch(`/api/barcodes?action=range-count&startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      showMessage('info', `${startDate} 到 ${endDate} 的扫描数量: ${data.count}`);
    } catch (error) {
      console.error('Error querying range count:', error);
      showMessage('error', '查询失败');
    }
  };

  // 格式化日期时间
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    const colorMap = {
      '已切割': 'bg-orange-100 text-orange-800',
      '已清角': 'bg-yellow-100 text-yellow-800',
      '已入库': 'bg-green-100 text-green-800',
      '部分出库': 'bg-blue-100 text-blue-800',
      '已出库': 'bg-purple-100 text-purple-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-3 text-gray-800">条码数据收集器</h2>

      {/* 消息提示 */}
      {message.text && (
        <div className={`mb-2 p-2 rounded text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' :
          message.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* 条码输入表单 */}
      <form onSubmit={addBarcode} className="mb-3">
        <div className="space-y-2">
          {/* 条码输入 */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="输入条码 (如: Rich-052125-16-04)..."
              className="flex-1 px-3 py-2 text-lg border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              disabled={loading}
            />
          </div>
          
          {/* 状态选择 */}
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-gray-700 min-w-fit">选择状态:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              disabled={loading}
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '添加中...' : '添加条码'}
            </button>
          </div>
        </div>
      </form>

      {/* 最近扫描记录 */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold mb-2 text-gray-700">最近扫描记录</h3>
        <div className="bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
          {recentBarcodes.length > 0 ? (
            <ul className="space-y-1">
              {recentBarcodes.map((item, index) => (
                <li key={item.id} className="text-sm flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono bg-yellow-200 px-1 py-0.5 rounded text-xs">
                      {item.barcode}
                    </span>
                    {item.status && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-600 text-xs">
                    {formatDateTime(item.scannedAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">暂无扫描记录</p>
          )}
        </div>
      </div>

      {/* 日期查询 */}
      <div className="grid md:grid-cols-2 gap-3">
        {/* 单日查询 */}
        <div className="bg-gray-50 p-2 rounded">
          <h4 className="text-sm font-semibold mb-2 text-gray-700">单日查询</h4>
          <div className="flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={queryDateCount}
              className="px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 transition-colors"
            >
              查询
            </button>
          </div>
        </div>

        {/* 日期范围查询 */}
        <div className="bg-gray-50 p-2 rounded">
          <h4 className="text-sm font-semibold mb-2 text-gray-700">日期范围查询</h4>
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <label className="text-xs text-gray-600 w-6">从:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-xs text-gray-600 w-6">到:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={queryRangeCount}
              className="w-full px-3 py-1 bg-purple-600 text-white text-sm font-semibold rounded hover:bg-purple-700 transition-colors"
            >
              查询范围
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}