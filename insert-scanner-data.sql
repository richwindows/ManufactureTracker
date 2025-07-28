-- 插入模拟扫码枪数据
-- 格式：扫码枪编号@ + 条码内容
-- 三个扫码枪：1@, 2@, 3@
-- 条码：Rich-07212025-01 到 Rich-07212025-10

-- 首先确保barcodes表有device_id字段（如果还没有的话）
-- ALTER TABLE barcodes ADD COLUMN IF NOT EXISTS device_id VARCHAR(10);
-- ALTER TABLE barcodes ALTER COLUMN barcode TYPE VARCHAR(50);

-- 插入扫码数据
INSERT INTO barcode_scans (barcode_data, device_port, scan_time) VALUES
-- 扫码枪1@的数据
('1@Rich-07212025-01', '1@', NOW() - INTERVAL '23 hours 45 minutes'),
('1@Rich-07212025-02', '1@', NOW() - INTERVAL '22 hours 30 minutes'),
('1@Rich-07212025-03', '1@', NOW() - INTERVAL '21 hours 15 minutes'),
('1@Rich-07212025-04', '1@', NOW() - INTERVAL '20 hours'),
('1@Rich-07212025-05', '1@', NOW() - INTERVAL '18 hours 45 minutes'),
('1@Rich-07212025-06', '1@', NOW() - INTERVAL '17 hours 30 minutes'),
('1@Rich-07212025-07', '1@', NOW() - INTERVAL '16 hours 15 minutes'),
('1@Rich-07212025-08', '1@', NOW() - INTERVAL '15 hours'),
('1@Rich-07212025-09', '1@', NOW() - INTERVAL '13 hours 45 minutes'),
('1@Rich-07212025-10', '1@', NOW() - INTERVAL '12 hours 30 minutes'),

-- 扫码枪2@的数据
('2@Rich-07212025-01', '2@', NOW() - INTERVAL '23 hours 20 minutes'),
('2@Rich-07212025-02', '2@', NOW() - INTERVAL '22 hours 10 minutes'),
('2@Rich-07212025-03', '2@', NOW() - INTERVAL '21 hours'),
('2@Rich-07212025-04', '2@', NOW() - INTERVAL '19 hours 50 minutes'),
('2@Rich-07212025-05', '2@', NOW() - INTERVAL '18 hours 30 minutes'),
('2@Rich-07212025-06', '2@', NOW() - INTERVAL '17 hours 20 minutes'),
('2@Rich-07212025-07', '2@', NOW() - INTERVAL '16 hours 10 minutes'),
('2@Rich-07212025-08', '2@', NOW() - INTERVAL '15 hours'),
('2@Rich-07212025-09', '2@', NOW() - INTERVAL '13 hours 50 minutes'),
('2@Rich-07212025-10', '2@', NOW() - INTERVAL '12 hours 40 minutes'),

-- 扫码枪3@的数据
('3@Rich-07212025-01', '3@', NOW() - INTERVAL '23 hours 10 minutes'),
('3@Rich-07212025-02', '3@', NOW() - INTERVAL '22 hours'),
('3@Rich-07212025-03', '3@', NOW() - INTERVAL '20 hours 50 minutes'),
('3@Rich-07212025-04', '3@', NOW() - INTERVAL '19 hours 40 minutes'),
('3@Rich-07212025-05', '3@', NOW() - INTERVAL '18 hours 20 minutes'),
('3@Rich-07212025-06', '3@', NOW() - INTERVAL '17 hours 10 minutes'),
('3@Rich-07212025-07', '3@', NOW() - INTERVAL '16 hours'),
('3@Rich-07212025-08', '3@', NOW() - INTERVAL '14 hours 50 minutes'),
('3@Rich-07212025-09', '3@', NOW() - INTERVAL '13 hours 40 minutes'),
('3@Rich-07212025-10', '3@', NOW() - INTERVAL '12 hours 20 minutes');
