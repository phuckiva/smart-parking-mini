// Utility để xử lý response API một cách nhất quán
class ResponseHandler {
    // Trả về response thành công
    success(res, data = null, message = 'Success', statusCode = 200) {
        const response = {
            success: true,
            message,
            timestamp: new Date().toISOString(),
            data
        };
        
        return res.status(statusCode).json(response);
    }

    // Trả về response lỗi
    error(res, message = 'Internal Server Error', statusCode = 500, details = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString(),
            error: {
                code: statusCode,
                details
            }
        };
        
        return res.status(statusCode).json(response);
    }

    // Trả về response cho pagination
    paginated(res, data, pagination, message = 'Success') {
        const response = {
            success: true,
            message,
            timestamp: new Date().toISOString(),
            data,
            pagination: {
                page: pagination.page || 1,
                limit: pagination.limit || 10,
                total: pagination.total || 0,
                totalPages: Math.ceil(pagination.total / pagination.limit) || 0
            }
        };
        
        return res.status(200).json(response);
    }

    // Trả về response không có dữ liệu (204 No Content)
    noContent(res, message = 'No Content') {
        return res.status(204).json({
            success: true,
            message,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = new ResponseHandler();