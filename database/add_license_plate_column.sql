-- Thêm cột license_plate vào bảng parking_history
ALTER TABLE public.parking_history 
ADD COLUMN license_plate TEXT;

-- Thêm comment cho cột mới
COMMENT ON COLUMN public.parking_history.license_plate IS 'Biển số xe khi check-in (có thể khác với license_plate trong bảng users)';

SELECT 'Added license_plate column to parking_history table!' as message;