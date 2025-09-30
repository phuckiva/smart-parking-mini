-- SQL script để tạo bảng parking_slots trong Supabase
-- Chạy script này trong Supabase SQL Editor

-- Tạo bảng parking_slots
CREATE TABLE IF NOT EXISTS parking_slots (
    id SERIAL PRIMARY KEY,
    slot_number VARCHAR(10) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
    location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thêm một số dữ liệu mẫu
INSERT INTO parking_slots (slot_number, status, location) VALUES
('A1', 'available', 'Tầng 1 - Khu A'),
('A2', 'occupied', 'Tầng 1 - Khu A'),
('A3', 'available', 'Tầng 1 - Khu A'),
('B1', 'available', 'Tầng 1 - Khu B'),
('B2', 'reserved', 'Tầng 1 - Khu B'),
('C1', 'available', 'Tầng 2 - Khu C'),
('C2', 'maintenance', 'Tầng 2 - Khu C')
ON CONFLICT (slot_number) DO NOTHING;

-- Tạo function để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tạo trigger để tự động cập nhật updated_at khi có thay đổi
CREATE TRIGGER update_parking_slots_updated_at
    BEFORE UPDATE ON parking_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();