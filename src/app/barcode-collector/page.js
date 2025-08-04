'use client';

import { useState, useCallback } from 'react';
import FullScreenDisplay from '@/components/CountingWindows';
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
      <FullScreenDisplay />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 页面标题 */}
      <div className="bg-white/10 backdrop-blur-md shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg">条码数据收集器</h1>
            <div className="flex space-x-4">
              <button
                onClick={handleToggleFullScreen}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 backdrop-blur-sm shadow-lg border border-white/20 font-medium"
              >
                全屏显示
              </button>
              <a
                href="/"
                className="bg-white/15 text-white px-4 py-2 rounded-xl hover:bg-white/25 transition-all duration-300 backdrop-blur-sm shadow-lg border border-white/20 font-medium"
              >
                返回主页
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 布局：上下排列 */}
        <div className="space-y-6">
          {/* 上方：显示面板（缩小尺寸） */}
          <div className="bg-white/12 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/20">
            <div className="h-80 lg:h-96">
              <FullScreenDisplay key={refreshKey} isCompact={true} />
            </div>
          </div>

          {/* 下方：输入管理面板 */}
          <div className="bg-white/12 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/20">
            <BarcodeManager onBarcodeAdded={handleBarcodeAdded} />
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-white/12 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">使用说明</h3>
          <div className="text-white/80 space-y-2">
            <p>• <strong className="text-cyan-400">条码格式：</strong>仅支持4位数字格式（如：1234）</p>
            <p>• <strong className="text-emerald-400">重复检测：</strong>系统会自动检测并阻止重复条码的录入</p>
            <p>• <strong className="text-blue-400">全屏显示：</strong>点击"全屏显示"按钮或按F11进入全屏模式</p>
            <p>• <strong className="text-purple-400">退出全屏：</strong>在全屏模式下按ESC或F11键退出</p>
            <p>• <strong className="text-pink-400">实时更新：</strong>数据每秒自动刷新，显示最新的统计信息</p>
            <p>• <strong className="text-indigo-400">日期查询：</strong>支持单日和日期范围的扫描数量查询</p>
          </div>
        </div>

        {/* 功能特性 */}
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="text-cyan-400 font-semibold text-lg mb-2 drop-shadow-lg">实时统计</div>
            <p className="text-white/80">显示今日扫描总数和历史最高记录</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="text-emerald-400 font-semibold text-lg mb-2 drop-shadow-lg">数据验证</div>
            <p className="text-white/80">自动验证条码格式并防止重复录入</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="text-purple-400 font-semibold text-lg mb-2 drop-shadow-lg">全屏显示</div>
            <p className="text-white/80">支持全屏模式便于远程查看数据</p>
          </div>
        </div>
      </div>
    </div>
  );
}