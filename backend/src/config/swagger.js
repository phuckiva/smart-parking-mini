const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Parking API',
      version: '1.0.0',
      description: 'API documentation cho hệ thống Smart Parking Mini',
      contact: {
        name: 'Smart Parking Team',
        email: 'admin@smartparking.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:8888',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID người dùng'
            },
            full_name: {
              type: 'string',
              description: 'Họ và tên'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email người dùng'
            },
            license_plate: {
              type: 'string',
              description: 'Biển số xe',
              nullable: true
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian tạo'
            }
          }
        },
        ParkingSlot: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID chỗ đỗ xe'
            },
            slot_name: {
              type: 'string',
              description: 'Tên chỗ đỗ xe'
            },
            status: {
              type: 'string',
              enum: ['available', 'occupied'],
              description: 'Trạng thái chỗ đỗ xe'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian cập nhật cuối'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian tạo'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email đăng nhập'
            },
            password: {
              type: 'string',
              description: 'Mật khẩu'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                },
                token: {
                  type: 'string',
                  description: 'JWT token'
                },
                role: {
                  type: 'string',
                  description: 'Vai trò người dùng'
                }
              }
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['full_name', 'email', 'password'],
          properties: {
            full_name: {
              type: 'string',
              description: 'Họ và tên'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Mật khẩu (tối thiểu 6 ký tự)'
            },
            license_plate: {
              type: 'string',
              description: 'Biển số xe (tùy chọn)'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'object'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string'
            },
            code: {
              type: 'integer'
            }
          }
        }
      }
    }
  },
  apis: ['./src/api/*.js', './src/controllers/*.js'] // Đường dẫn đến các file chứa JSDoc comments
};

const specs = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  specs
};