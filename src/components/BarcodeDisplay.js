'use client';

import { useState, useEffect } from 'react';

export default function BarcodeDisplay({ isFullScreen = false, onToggleFullScreen }) {
  const [todayCount, setTodayCount] = useState(0);
  const [highestRecord, setHighestRecord] = useState({ count: 0, date: '' });
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // 获取今日数量
  const fetchTodayCount = async () => {
    try {
      const response = await fetch('/api/barcodes?action=today-count');
      const data = await response.json();
      setTodayCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching today count:', error);
    }
  };

  // 获取最高记录
  const fetchHighestRecord = async () => {
    try {
      const response = await fetch('/api/barcodes?action=highest-record');
      const data = await response.json();
      setHighestRecord(data);
    } catch (error) {
      console.error('Error fetching highest record:', error);
    }
  };

  // 更新时间
  const updateTime = () => {
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString('zh-CN', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));
    setCurrentDate(now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-'));
  };

  useEffect(() => {
    // 初始数据加载
    fetchTodayCount();
    fetchHighestRecord();
    updateTime();

    // 设置定时器
    const timer = setInterval(() => {
      updateTime();
      fetchTodayCount();
      fetchHighestRecord();
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape' && isFullScreen) {
        onToggleFullScreen();
      }
      if (event.key === 'F11') {
        event.preventDefault();
        onToggleFullScreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullScreen, onToggleFullScreen]);

  const containerClass = isFullScreen 
    ? 'fixed inset-0 z-50 bg-gray-100' 
    : 'w-full h-screen bg-gray-100';

  return (
    <div className={containerClass}>
      <div className="flex h-full">
        {/* 左侧 - 今日数量显示 */}
        <div className="flex-[6] flex flex-col justify-center items-center bg-gray-100">
          <h1 className={`text-center font-bold text-red-600 mb-8 ${
            isFullScreen ? 'text-6xl md:text-8xl' : 'text-4xl md:text-6xl'
          }`}>
            Total Windows Today:
          </h1>
          <div className={`text-center font-bold text-red-600 ${
            isFullScreen ? 'text-[20rem] md:text-[30rem]' : 'text-[8rem] md:text-[12rem]'
          }`}>
            {todayCount}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="w-2 bg-black"></div>

        {/* 右侧 - 记录和时间信息 */}
        <div className="flex-[3] flex flex-col justify-center items-end pr-8 bg-gray-100 space-y-6">
          {/* 最高记录标题 */}
          <h2 className={`text-blue-600 font-bold ${
            isFullScreen ? 'text-5xl md:text-7xl' : 'text-3xl md:text-5xl'
          }`}>
            Best Record:
          </h2>

          {/* 记录日期 */}
          <div className="flex items-center space-x-4">
            <span className={`text-blue-600 font-bold ${
              isFullScreen ? 'text-3xl md:text-5xl' : 'text-2xl md:text-3xl'
            }`}>
              Date:
            </span>
            <span className={`text-blue-600 font-bold ${
              isFullScreen ? 'text-4xl md:text-6xl' : 'text-2xl md:text-4xl'
            }`}>
              {highestRecord.date || '--'}
            </span>
          </div>

          {/* 记录数量 */}
          <div className="flex items-center space-x-4">
            <span className={`text-blue-600 font-bold ${
              isFullScreen ? 'text-3xl md:text-5xl' : 'text-2xl md:text-3xl'
            }`}>
              Windows/Day:
            </span>
            <span className={`text-blue-600 font-bold ${
              isFullScreen ? 'text-5xl md:text-8xl' : 'text-3xl md:text-5xl'
            }`}>
              {highestRecord.count}
            </span>
          </div>

          {/* 今日日期标题 */}
          <h3 className={`text-red-600 font-bold mt-8 ${
            isFullScreen ? 'text-4xl md:text-6xl' : 'text-2xl md:text-4xl'
          }`}>
            Today&apos;s Date
          </h3>

          {/* 当前日期 */}
          <div className={`text-red-600 font-bold ${
            isFullScreen ? 'text-5xl md:text-7xl' : 'text-3xl md:text-5xl'
          }`}>
            {currentDate}
          </div>

          {/* 当前时间 */}
          <div className={`text-red-600 font-bold ${
            isFullScreen ? 'text-5xl md:text-7xl' : 'text-3xl md:text-5xl'
          }`}>
            {currentTime}
          </div>
        </div>
      </div>

      {/* 控制按钮 */}
      {!isFullScreen && (
        <button
          onClick={onToggleFullScreen}
          className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          全屏显示 (F11)
        </button>
      )}

      {isFullScreen && (
        <div className="fixed bottom-4 left-4 text-white bg-black bg-opacity-50 px-4 py-2 rounded">
          按 ESC 或 F11 退出全屏
        </div>
      )}
    </div>
  );
} 