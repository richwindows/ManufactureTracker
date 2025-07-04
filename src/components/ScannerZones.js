'use client'

import { useState } from 'react'
import { Settings, Scan, CheckCircle, X } from 'lucide-react'

export default function ScannerZones({ onZoneSelect, currentZone, onClose }) {
  const [selectedZone, setSelectedZone] = useState(currentZone || '')

  const zones = [
    { id: 'cutting', name: '开料工位', status: '开料', color: 'bg-orange-500', icon: '🔧' },
    { id: 'welding', name: '焊接工位', status: '焊接', color: 'bg-red-500', icon: '🔥' },
    { id: 'cleaning', name: '清角工位', status: '清角', color: 'bg-yellow-500', icon: '✨' },
    { id: 'assembly', name: '组装工位', status: '组装', color: 'bg-blue-500', icon: '🔩' },
    { id: 'warehouse_in', name: '入库工位', status: '入库', color: 'bg-green-500', icon: '📦' },
    { id: 'warehouse_out', name: '出库工位', status: '出库', color: 'bg-purple-500', icon: '🚚' }
  ]

  const handleConfirm = () => {
    const zone = zones.find(z => z.id === selectedZone)
    if (zone) {
      onZoneSelect(zone)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">选择扫码工位</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              请选择当前扫码枪所在的工位，扫描后产品将更新到对应状态
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zones.map((zone) => (
              <div
                key={zone.id}
                onClick={() => setSelectedZone(zone.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedZone === zone.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${zone.color} mr-3`}>
                      {zone.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{zone.name}</h3>
                      <p className="text-sm text-gray-500">状态: {zone.status}</p>
                    </div>
                  </div>
                  {selectedZone === zone.id && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {currentZone && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                当前工位: <span className="font-medium">{zones.find(z => z.id === currentZone)?.name || currentZone}</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedZone}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Scan className="h-4 w-4 mr-2 inline" />
            确认选择
          </button>
        </div>
      </div>
    </div>
  )
} 