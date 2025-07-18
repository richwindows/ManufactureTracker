'use client';

import { useState, useEffect, useRef } from 'react';

export default function BarcodeManager({ onBarcodeAdded }) {
  const [barcode, setBarcode] = useState('');
  const [recentBarcodes, setRecentBarcodes] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

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

    setLoading(true);
    
    try {
      const response = await fetch('/api/barcodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barcode: barcode.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', '条码添加成功！');
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">条码数据收集器</h2>

      {/* 消息提示 */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' :
          message.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* 条码输入表单 */}
      <form onSubmit={addBarcode} className="mb-6">
        <div className="flex gap-4">
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="输入4位数字条码..."
            className="flex-1 px-4 py-3 text-2xl border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            maxLength={4}
            pattern="\d{4}"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white text-xl font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '添加中...' : '添加条码'}
          </button>
        </div>
      </form>

      {/* 最近扫描记录 */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3 text-gray-700">最近扫描记录</h3>
        <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
          {recentBarcodes.length > 0 ? (
            <ul className="space-y-2">
              {recentBarcodes.map((item, index) => (
                <li key={item.id} className="text-lg">
                  <span className="font-mono bg-yellow-200 px-2 py-1 rounded">
                    {item.barcode}
                  </span>
                  <span className="ml-3 text-gray-600">
                    {formatDateTime(item.scannedAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-lg">暂无扫描记录</p>
          )}
        </div>
      </div>

      {/* 日期查询 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 单日查询 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3 text-gray-700">单日查询</h4>
          <div className="flex gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 px-3 py-2 text-lg border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={queryDateCount}
              className="px-4 py-2 bg-green-600 text-white text-lg font-semibold rounded hover:bg-green-700 transition-colors"
            >
              查询
            </button>
          </div>
        </div>

        {/* 日期范围查询 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3 text-gray-700">日期范围查询</h4>
          <div className="space-y-3">
            <div className="flex gap-3 items-center">
              <label className="text-sm text-gray-600 w-12">从:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2 text-lg border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3 items-center">
              <label className="text-sm text-gray-600 w-12">到:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-3 py-2 text-lg border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={queryRangeCount}
              className="w-full px-4 py-2 bg-purple-600 text-white text-lg font-semibold rounded hover:bg-purple-700 transition-colors"
            >
              查询范围
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 