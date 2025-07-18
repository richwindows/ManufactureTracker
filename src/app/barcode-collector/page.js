'use client';

import { useState, useCallback } from 'react';
import BarcodeDisplay from '@/components/BarcodeDisplay';
import BarcodeManager from '@/components/BarcodeManager';

export default function BarcodeCollectorPage() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 切换全屏模式
  const handleToggleFullScreen = useCallback(() => {
    setIsFullScreen(prev => !prev);
  }, []);

  // 条码添加成功后刷新显示
  const handleBarcodeAdded = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // 如果是全屏模式，只显示大屏幕显示组件
  if (isFullScreen) {
    return (
      <BarcodeDisplay 
        isFullScreen={true} 
        onToggleFullScreen={handleToggleFullScreen}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 页面标题 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">条码数据收集器</h1>
            <div className="flex space-x-4">
              <button
                onClick={handleToggleFullScreen}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                全屏显示
              </button>
              <a
                href="/"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                返回主页
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 布局：上方显示面板，下方输入管理 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：显示面板 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <BarcodeDisplay 
                key={refreshKey}
                isFullScreen={false} 
                onToggleFullScreen={handleToggleFullScreen}
              />
            </div>
          </div>

          {/* 右侧：输入管理面板 */}
          <div className="lg:col-span-1">
            <BarcodeManager onBarcodeAdded={handleBarcodeAdded} />
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">使用说明</h3>
          <div className="text-gray-600 space-y-2">
            <p>• <strong>条码格式：</strong>仅支持4位数字格式（如：1234）</p>
            <p>• <strong>重复检测：</strong>系统会自动检测并阻止重复条码的录入</p>
            <p>• <strong>全屏显示：</strong>点击"全屏显示"按钮或按F11进入全屏模式</p>
            <p>• <strong>退出全屏：</strong>在全屏模式下按ESC或F11键退出</p>
            <p>• <strong>实时更新：</strong>数据每秒自动刷新，显示最新的统计信息</p>
            <p>• <strong>日期查询：</strong>支持单日和日期范围的扫描数量查询</p>
          </div>
        </div>

        {/* 功能特性 */}
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-600 font-semibold text-lg mb-2">实时统计</div>
            <p className="text-blue-700">显示今日扫描总数和历史最高记录</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-600 font-semibold text-lg mb-2">数据验证</div>
            <p className="text-green-700">自动验证条码格式并防止重复录入</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-purple-600 font-semibold text-lg mb-2">全屏显示</div>
            <p className="text-purple-700">支持全屏模式便于远程查看数据</p>
          </div>
        </div>
      </div>
    </div>
  );
} 