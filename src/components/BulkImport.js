'use client'

import { useState } from 'react'
import { Upload, FileText, Check, X, AlertCircle } from 'lucide-react'

export default function BulkImport({ onImportComplete, onClose }) {
  const [textData, setTextData] = useState('')
  const [parsedData, setParsedData] = useState([])
  const [isParsingValid, setIsParsingValid] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  // 解析粘贴的表格数据
  const parseTableData = (text) => {
    if (!text.trim()) {
      setParsedData([])
      setIsParsingValid(false)
      return
    }

    try {
      const lines = text.trim().split('\n')
      const data = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // 支持制表符或多个空格分隔
        const columns = line.split(/\t|\s{2,}/).map(col => col.trim())
        
                                 // 跳过表头行（如果包含Customer等字段名）
                         if (columns[0] && columns[0].toLowerCase().includes('customer') && i === 0) {
          continue
        }

        if (columns.length >= 8) { // 至少8列数据
          const rowData = {
            customer: columns[0] || '',
            productId: columns[1] || '',
            style: columns[2] || '',
            size: columns[3] || '',
            frame: columns[4] || '',
            glass: columns[5] || '',
            grid: columns[6] || '',
            po: columns[7] || '',
            batchNo: columns[8] || columns[7] // 如果没有第9列，使用第8列作为batchNo
          }

          // 简单验证
          if (rowData.customer && rowData.productId && rowData.style) {
            data.push(rowData)
          }
        }
      }

      setParsedData(data)
      setIsParsingValid(data.length > 0)
    } catch (error) {
      setParsedData([])
      setIsParsingValid(false)
    }
  }

  const handleTextChange = (e) => {
    const value = e.target.value
    setTextData(value)
    parseTableData(value)
    setImportResult(null) // 清除之前的导入结果
  }

  const handleImport = async () => {
    if (!isParsingValid || parsedData.length === 0) return

    setImporting(true)
    try {
      const response = await fetch('/api/products/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: parsedData }),
      })

      const result = await response.json()
      setImportResult(result)

      if (response.ok && result.results.success > 0) {
        onImportComplete()
      }
    } catch (error) {
      setImportResult({
        error: '导入失败：' + error.message
      })
    } finally {
      setImporting(false)
    }
  }

  const sampleData = `Customer	ID	Style	Size	Frame	Glass	Grid	P.O	Batch NO.
Luis107012	21	XO	35 1/2 x 23 1/2	Nailon	OBS/cl+	TLC	06032025-02-05	BATCH-001
Luis107012	22	XO	35 1/2 x 23 1/2	Nailon	OBS/cl+	TLC	06032025-02-05	BATCH-002`

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center">
            <Upload className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">批量导入产品</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 说明文档 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 mb-2">使用说明</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>从Excel、表格或其他来源复制产品数据</li>
                  <li>粘贴到下方文本框中（支持制表符分隔）</li>
                  <li>系统会自动解析并预览数据</li>
                  <li>确认无误后点击"开始导入"</li>
                </ol>
                <p className="text-xs text-blue-600 mt-2">
                  数据格式：客户名 | 产品ID | 样式 | 尺寸 | 框架 | 玻璃 | 网格 | P.O | 批次号
                </p>
              </div>
            </div>
          </div>

          {/* 数据输入区域 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                粘贴表格数据
              </label>
              <textarea
                value={textData}
                onChange={handleTextChange}
                placeholder={`请粘贴表格数据，例如：\n\n${sampleData}`}
                className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>

            {/* 解析状态 */}
            <div className="flex items-center space-x-2">
              {isParsingValid ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    成功解析 {parsedData.length} 条数据
                  </span>
                </>
              ) : textData ? (
                <>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">
                    数据格式不正确，请检查格式
                  </span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    等待数据输入...
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 数据预览 */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">数据预览 (前5条)</h3>
              <div className="overflow-x-auto bg-gray-50 rounded-lg p-3">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="px-2 py-1">客户</th>
                      <th className="px-2 py-1">产品ID</th>
                      <th className="px-2 py-1">样式</th>
                      <th className="px-2 py-1">尺寸</th>
                      <th className="px-2 py-1">框架</th>
                      <th className="px-2 py-1">玻璃</th>
                      <th className="px-2 py-1">网格</th>
                      <th className="px-2 py-1">P.O</th>
                      <th className="px-2 py-1">批次号</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="px-2 py-1">{row.customer}</td>
                        <td className="px-2 py-1">{row.productId}</td>
                        <td className="px-2 py-1">{row.style}</td>
                        <td className="px-2 py-1">{row.size}</td>
                        <td className="px-2 py-1">{row.frame}</td>
                        <td className="px-2 py-1">{row.glass}</td>
                        <td className="px-2 py-1">{row.grid}</td>
                        <td className="px-2 py-1">{row.po}</td>
                        <td className="px-2 py-1">{row.batchNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 5 && (
                  <p className="text-xs text-gray-500 mt-2">
                    ...还有 {parsedData.length - 5} 条数据
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 导入结果 */}
          {importResult && (
            <div className={`rounded-lg p-4 ${
              importResult.error 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-green-50 border border-green-200'
            }`}>
              <div className={`text-sm ${
                importResult.error ? 'text-red-700' : 'text-green-700'
              }`}>
                {importResult.error ? (
                  <div className="flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 text-red-600" />
                    <span>{importResult.error}</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center mb-2">
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      <span className="font-medium">{importResult.message}</span>
                    </div>
                    {importResult.results.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-red-600">
                          查看错误详情 ({importResult.results.errors.length})
                        </summary>
                        <ul className="mt-1 ml-4 list-disc text-red-600 text-xs">
                          {importResult.results.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={!isParsingValid || importing || parsedData.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {importing ? '导入中...' : `开始导入 (${parsedData.length} 条)`}
          </button>
        </div>
      </div>
    </div>
  )
} 