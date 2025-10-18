import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getProfile } from '../api';
import { getRole } from '../auth';

export default function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [currentRole, setCurrentRole] = useState(getRole());
  const [selectedSection, setSelectedSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    availableSlots: 0,
    reservedSlots: 0,
    occupiedSlots: 0,
    userStats: {
      monthlyParking: 0,
      averageTime: '0',
      points: 0
    },
    recentActivities: [],
    systemPerformance: 0
  });
  const location = useLocation();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load profile data
        const res = await getProfile();
        const profileData = res?.data || null;
        setProfile(profileData);
        
        // Update role from profile if available
        if (profileData?.role) {
          setCurrentRole(profileData.role);
        }

        // Load dashboard statistics
        await Promise.all([
          loadDashboardStats(),
          loadUserStats(),
          loadRecentActivities()
        ]);

      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Load slots data
      const slotsResponse = await fetch('/api/admin/slots');
      if (slotsResponse.ok) {
        const slotsData = await slotsResponse.json();
        const slots = slotsData.data || [];
        
        const availableSlots = slots.filter(slot => slot.status === 'AVAILABLE').length;
        const reservedSlots = slots.filter(slot => slot.status === 'RESERVED').length;
        const occupiedSlots = slots.filter(slot => slot.status === 'OCCUPIED').length;
        
        // Load users count
        const usersResponse = await fetch('/api/admin/users');
        const usersData = usersResponse.ok ? await usersResponse.json() : { data: [] };
        const totalUsers = usersData.data?.length || 0;

        // Calculate system performance
        const totalSlots = slots.length;
        const systemPerformance = totalSlots > 0 ? Math.round((occupiedSlots + reservedSlots) / totalSlots * 100) : 0;

        setDashboardData(prev => ({
          ...prev,
          totalUsers,
          availableSlots,
          reservedSlots,
          occupiedSlots,
          systemPerformance
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      if (!profile?.id) return;
      
      // Load user's parking history
      const historyResponse = await fetch(`/api/history/user/${profile.id}`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        const history = historyData.data || [];
        
        // Calculate current month parking count
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyParking = history.filter(record => {
          const recordDate = new Date(record.check_in_time);
          return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
        }).length;

        // Calculate average parking time
        const completedSessions = history.filter(record => record.check_out_time);
        let totalMinutes = 0;
        completedSessions.forEach(record => {
          const checkIn = new Date(record.check_in_time);
          const checkOut = new Date(record.check_out_time);
          totalMinutes += (checkOut - checkIn) / (1000 * 60);
        });
        const averageMinutes = completedSessions.length > 0 ? totalMinutes / completedSessions.length : 0;
        const averageTime = `${Math.round(averageMinutes / 60 * 10) / 10}h`;

        // Calculate points (simple logic: 10 points per parking session)
        const points = history.length * 10;

        setDashboardData(prev => ({
          ...prev,
          userStats: {
            monthlyParking,
            averageTime,
            points
          }
        }));
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadRecentActivities = async () => {
    try {
      // Load recent activities for admin
      if (currentRole === 'ADMIN') {
        const activitiesResponse = await fetch('/api/admin/recent-activities');
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          setDashboardData(prev => ({
            ...prev,
            recentActivities: activitiesData.data || []
          }));
        } else {
          // Fallback to mock data if API not available
          setDashboardData(prev => ({
            ...prev,
            recentActivities: [
              { id: 1, message: 'Người dùng mới đăng ký', time: '5 phút trước', type: 'user' },
              { id: 2, message: 'Chỗ đỗ A1 được đặt', time: '10 phút trước', type: 'reservation' },
              { id: 3, message: 'Thanh toán hoàn tất', time: '15 phút trước', type: 'payment' }
            ]
          }));
        }
      }
    } catch (error) {
      console.error('Error loading recent activities:', error);
      // Fallback to mock data
      setDashboardData(prev => ({
        ...prev,
        recentActivities: [
          { id: 1, message: 'Người dùng mới đăng ký', time: '5 phút trước', type: 'user' },
          { id: 2, message: 'Chỗ đỗ A1 được đặt', time: '10 phút trước', type: 'reservation' },
          { id: 3, message: 'Thanh toán hoàn tất', time: '15 phút trước', type: 'payment' }
        ]
      }));
    }
  };

  const isAdmin = currentRole === 'ADMIN';

  // Debug log để kiểm tra
  console.log('[Dashboard] currentRole:', currentRole, 'isAdmin:', isAdmin, 'profile:', profile?.role);

  // Menu items cho Admin
  const adminMenuItems = [
    { id: 'overview', label: 'Tổng Quan Hệ Thống', icon: 'bi-grid-1x2-fill', emoji: '📊', desc: 'Theo dõi tình hình tổng thể' },
    { id: 'users', label: 'Quản Lý Người Dùng', icon: 'bi-people-fill', emoji: '👥', link: '/admin/users', desc: 'Quản lý tài khoản người dùng' },
    { id: 'roles', label: 'Phân Quyền Hệ Thống', icon: 'bi-shield-check-fill', emoji: '🛡️', link: '/admin/roles', desc: 'Cấu hình vai trò và quyền hạn' },
    { id: 'slots', label: 'Quản Lý Bãi Đỗ Xe', icon: 'bi-grid-3x3-gap-fill', emoji: '🅿️', link: '/admin/slots', desc: 'Thiết lập và quản lý chỗ đỗ' },
    { id: 'reservations', label: 'Theo Dõi Đặt Chỗ', icon: 'bi-calendar-check-fill', emoji: '📅', link: '/admin/reservations', desc: 'Quản lý đặt chỗ và lịch trình' },
    { id: 'history', label: 'Lịch Sử Hoạt Động', icon: 'bi-clock-history', emoji: '📋', link: '/admin/history', desc: 'Xem báo cáo và thống kê' }
  ];

  // Menu items cho User
  const userMenuItems = [
    { id: 'overview', label: 'Trang Chủ Cá Nhân', icon: 'bi-house-fill', emoji: '🏠', desc: 'Thông tin tổng quan của bạn' },
    { id: 'slots', label: 'Đặt Chỗ Đậu Xe', icon: 'bi-car-front-fill', emoji: '🚗', link: '/slots', desc: 'Tìm và đặt chỗ đậu xe' },
    { id: 'history', label: 'Lịch Sử Của Tôi', icon: 'bi-clock-history', emoji: '📝', link: '/history', desc: 'Xem lại các lần đậu xe' },
    { id: 'profile', label: 'Hồ Sơ Cá Nhân', icon: 'bi-person-fill', emoji: '👤', link: '/profile', desc: 'Cập nhật thông tin cá nhân' }
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const statsData = [
    { title: 'Tổng số người dùng', value: dashboardData.totalUsers, icon: 'bi-people', color: 'primary', emoji: '👥' },
    { title: 'Chỗ đỗ xe trống', value: dashboardData.availableSlots, icon: 'bi-check-circle', color: 'success', emoji: '🅿️' },
    { title: 'Đã được đặt trước', value: dashboardData.reservedSlots, icon: 'bi-calendar-check', color: 'warning', emoji: '📅' },
    { title: 'Đang được sử dụng', value: dashboardData.occupiedSlots, icon: 'bi-car-front', color: 'danger', emoji: '🚗' },
  ];

  const renderOverviewContent = () => {
    if (isAdmin) {
      return (
        <div className="admin-overview">
          {/* Stats Grid */}
          <div className="row g-3 mb-4">
            {statsData.map((stat, index) => (
              <div key={index} className="col-xl-3 col-md-6">
                <div className={`stat-card`}>
                  <div className="stat-icon">
                    <div className="stat-card-emoji show-emoji">{stat.emoji}</div>
                    <i className={`bi ${stat.icon}`}></i>
                  </div>
                  <div className="stat-content">
                    <h3 className="stat-value">{stat.value}</h3>
                    <p className="stat-label">{stat.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Thông tin chi tiết hệ thống */}
          <div className="admin-insights">
            <h5 className="section-title">Thông Tin Hệ Thống Smart Parking</h5>
            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-header">
                  <div className="insight-icon">
                    <span className="insight-emoji">📈</span>
                    <i className="bi bi-graph-up-arrow"></i>
                  </div>
                  <h6>Hiệu Suất Hoạt Động Hôm Nay</h6>
                </div>
                <div className="insight-body">
                  <div className="metric">
                    <span className="metric-value">{dashboardData.systemPerformance}%</span>
                    <span className="metric-label">Tỷ lệ sử dụng bãi đỗ xe</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${dashboardData.systemPerformance}%`}}></div>
                  </div>
                </div>
              </div>

              <div className="insight-card">
                <div className="insight-header">
                  <div className="insight-icon">
                    <span className="insight-emoji">⚡</span>
                    <i className="bi bi-clock-history"></i>
                  </div>
                  <h6>Hoạt Động Gần Đây</h6>
                </div>
                <div className="insight-body">
                  <div className="activity-list">
                    {dashboardData.recentActivities.length > 0 ? (
                      dashboardData.recentActivities.map((activity) => (
                        <div key={activity.id} className="activity-item">
                          <div className="activity-dot"></div>
                          <div className="activity-content">
                            <span>{activity.message}</span>
                            <small>{activity.time}</small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="activity-item">
                        <div className="activity-dot"></div>
                        <div className="activity-content">
                          <span>Chưa có hoạt động trong thời gian gần đây</span>
                          <small>Hệ thống đang chờ dữ liệu cập nhật</small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="insight-card">
                <div className="insight-header">
                  <div className="insight-icon">
                    <span className="insight-emoji show-emoji">🧠</span>
                    <i className="bi bi-lightning-charge"></i>
                  </div>
                  <h6>Phân Tích Thông Minh</h6>
                </div>
                <div className="insight-body">
                  <p>Khung giờ cao điểm: <strong>08:00 - 09:00 Sáng</strong></p>
                  <p>Khu vực được ưa chuộng: <strong>Khu đỗ xe A</strong></p>
                  <div className="insight-tip">
                    💡 Khuyến nghị: {dashboardData.availableSlots < 5 ? 
                      'Cần tăng cường quản lý - sắp hết chỗ đỗ xe' : 
                      'Hệ thống đang hoạt động ổn định và hiệu quả'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="user-overview">
          {/* Phần chào mừng */}
          <div className="welcome-card">
            <div className="welcome-content">
              <h2>Chào Mừng Bạn Trở Lại!</h2>
              <p>Xin chào <strong>{profile?.name || 'bạn'}</strong>, hãy bắt đầu trải nghiệm dịch vụ đỗ xe thông minh ngay hôm nay.</p>
            </div>
            <div className="welcome-icon">
              <i className="bi bi-car-front-fill"></i>
            </div>
          </div>

          {/* User Actions */}
          <div className="user-features">
            <div className="feature-grid">
              <Link to="/slots" className="feature-card primary">
                <div className="feature-background">
                  <div className="feature-pattern"></div>
                </div>
                <div className="feature-content">
                  <div className="feature-icon">
                    <div className="feature-emoji show-emoji">🚗</div>
                    <i className="bi bi-car-front-fill"></i>
                  </div>
                  <h4>Đặt chỗ đậu xe</h4>
                  <p>Tìm và đặt chỗ đậu xe nhanh chóng</p>
                  <div className="feature-action">
                    <span>Bắt đầu ngay</span>
                    <i className="bi bi-arrow-right"></i>
                  </div>
                </div>
              </Link>

              <Link to="/history" className="feature-card secondary">
                <div className="feature-background">
                  <div className="feature-pattern"></div>
                </div>
                <div className="feature-content">
                  <div className="feature-icon">
                    <div className="feature-emoji show-emoji">📖</div>
                    <i className="bi bi-clock-history"></i>
                  </div>
                  <h4>Lịch sử đậu xe</h4>
                  <p>Xem lại các lần đậu xe của bạn</p>
                  <div className="feature-action">
                    <span>Xem chi tiết</span>
                    <i className="bi bi-arrow-right"></i>
                  </div>
                </div>
              </Link>
            </div>

            {/* User Stats */}
            <div className="user-stats">
              <h5 className="section-title">Thống kê cá nhân</h5>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-icon">
                    <span className="stat-emoji show-emoji">📅</span>
                    <i className="bi bi-calendar-check"></i>
                  </div>
                  <div className="stat-info">
                    <h6>Tháng này</h6>
                    <span>{dashboardData.userStats.monthlyParking} lần đậu xe</span>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">
                    <span className="stat-emoji show-emoji">⏱️</span>
                    <i className="bi bi-clock"></i>
                  </div>
                  <div className="stat-info">
                    <h6>Thời gian trung bình</h6>
                    <span>{dashboardData.userStats.averageTime}</span>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">
                    <span className="stat-emoji show-emoji">⭐</span>
                    <i className="bi bi-star-fill"></i>
                  </div>
                  <div className="stat-info">
                    <h6>Điểm tích lũy</h6>
                    <span>{dashboardData.userStats.points} điểm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="tips-section">
              <h5 className="section-title">Mẹo hữu ích</h5>
              <div className="tip-card">
                <div className="tip-icon">
                  💡
                </div>
                <div className="tip-content">
                  <h6>Tiết kiệm thời gian</h6>
                  <p>Đặt chỗ trước 15 phút để đảm bảo có chỗ đậu xe thuận tiện nhất!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="dashboard-container">
      {/* Main Layout */}
      <div className="main-layout">
        <div className="container">
          <div className="layout-grid">
            {/* Sidebar Navigation */}
            <div className="sidebar">
              <div className="sidebar-header">
                <h6>Danh Mục Chức Năng</h6>
              </div>
              <div className="nav-menu">
                {menuItems.map((item) => (
                  item.link ? (
                    <Link key={item.id} to={item.link} className="nav-item">
                      <div className="nav-icon">
                        <div className="icon-emoji show-emoji">{item.emoji}</div>
                        <i className={`bi ${item.icon}`}></i>
                      </div>
                      <div className="nav-content">
                        <span className="nav-title">{item.label}</span>
                        <small className="nav-desc">{item.desc}</small>
                      </div>
                      <div className="nav-arrow">
                        <i className="bi bi-arrow-right"></i>
                      </div>
                    </Link>
                  ) : (
                    <button
                      key={item.id}
                      onClick={() => setSelectedSection(item.id)}
                      className={`nav-item ${selectedSection === item.id ? 'active' : ''}`}
                    >
                      <div className="nav-icon">
                        <div className="icon-emoji show-emoji">{item.emoji}</div>
                        <i className={`bi ${item.icon}`}></i>
                      </div>
                      <div className="nav-content">
                        <span className="nav-title">{item.label}</span>
                        <small className="nav-desc">{item.desc}</small>
                      </div>
                    </button>
                  )
                ))}
              </div>
              
              {/* Thông tin người dùng */}
              <div className="sidebar-profile">
                <div className="profile-avatar">
                  <i className="bi bi-person-fill"></i>
                </div>
                <div className="profile-info">
                  <h6>{profile?.name || 'Tên người dùng'}</h6>
                  <small>{profile?.email || 'email@example.com'}</small>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="content-area">
              {loading && (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Đang tải dữ liệu...</p>
                </div>
              )}

              {error && (
                <div className="error-alert">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  {error}
                </div>
              )}

              {!loading && selectedSection === 'overview' && renderOverviewContent()}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .main-layout {
          padding: 2rem 0;
          background: #f8f9fc;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .layout-grid {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        .sidebar {
          background: white;
          border-radius: 12px;
          padding: 1.2rem;
          box-shadow: 0 2px 12px rgba(0, 123, 255, 0.08);
          position: sticky;
          top: 80px;
          border: 1px solid rgba(0, 123, 255, 0.1);
        }

        .sidebar-header h6 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-align: center;
          padding: 8px 0;
          background: linear-gradient(135deg, #f8f9ff, #fbfdffff);
          border-radius: 6px;
          border: 1px solid rgba(0, 123, 255, 0.1);
        }

        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-bottom: 1.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-radius: 8px;
          color: #495057;
          text-decoration: none;
          border: none;
          background: none;
          font-size: 0.85rem;
          transition: all 0.3s ease;
          cursor: pointer;
          width: 100%;
          text-align: left;
          position: relative;
          overflow: hidden;
        }

        .nav-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(135deg, #090909ff, #050505ff);
          transform: scaleY(0);
          transition: transform 0.3s ease;
        }

        .nav-item:hover::before {
          transform: scaleY(1);
        }

        .nav-item:hover {
          background: linear-gradient(135deg, #f8f9ff, #e3f2fd);
          color: #070707ff;
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
        }

        .nav-item.active {
          background: linear-gradient(135deg, #070808ff, #070707ff);
          color: white;
          transform: translateX(4px);
          box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
        }

        .nav-item.active::before {
          transform: scaleY(1);
          background: rgba(255, 255, 255, 0.3);
        }

        .nav-icon {
          width: 40px;
          height: 40px;
          background: rgba(0, 123, 255, 0.1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .icon-emoji {
          position: absolute;
          font-size: 1.2rem;
          opacity: 0;
          transform: scale(0.8) rotate(-10deg);
          transition: all 0.3s ease;
          z-index: 2;
        }

        .icon-emoji.show-emoji {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }

        .nav-item:hover .icon-emoji {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }

        .nav-item:hover .nav-icon i {
          opacity: 0;
          transform: scale(0.8) rotate(10deg);
        }

        .nav-item:hover .nav-icon {
          background: linear-gradient(135deg, rgba(7, 7, 8, 0.2), rgba(0, 86, 179, 0.2));
          transform: scale(1.05) rotate(-3deg);
          box-shadow: 0 2px 10px rgba(10, 10, 10, 0.3);
        }

        .nav-item.active .nav-icon {
          background: rgba(255, 255, 255, 0.25);
          color: white;
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
        }

        .nav-item.active .icon-emoji {
          opacity: 1;
          transform: scale(1.05) rotate(0deg);
        }

        .nav-item.active .nav-icon i {
          opacity: 0;
        }

        .nav-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nav-title {
          font-weight: 600;
          font-size: 0.85rem;
          line-height: 1.2;
        }

        .nav-desc {
          font-size: 0.7rem;
          opacity: 0.7;
          line-height: 1.2;
        }

        .nav-arrow {
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .nav-item:hover .nav-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .nav-item.active .nav-arrow {
          opacity: 1;
          transform: translateX(0);
          color: white;
        }

        .sidebar-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0.8rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .profile-avatar {
          width: 35px;
          height: 35px;
          background: linear-gradient(135deg, #060607ff, #080808ff);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1rem;
        }

        .profile-info h6 {
          margin: 0;
          font-size: 0.85rem;
          font-weight: 600;
          color: #495057;
        }

        .profile-info small {
          color: #6c757d;
          font-size: 0.75rem;
        }

        .content-area {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 12px rgba(0, 123, 255, 0.08);
          min-height: 500px;
          border: 1px solid rgba(0, 123, 255, 0.1);
        }

        .error-alert {
          background: #fff5f5;
          border: 1px solid #fed7d7;
          color: #c53030;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #6c757d;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #030303ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Admin Overview Styles */
        .admin-overview .stat-card {
          background: white;
          border: 2px solid #e9ecef;
          color: #050505ff;
          padding: 1.5rem;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .admin-overview .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #090909ff, #0a0b0bff);
        }

        .admin-overview .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 123, 255, 0.15);
          border-color: #0a0a0aff;
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #0f1010ff, #080808ff);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: white;
          position: relative;
          transition: all 0.3s ease;
        }

        .stat-card-emoji {
          position: absolute;
          font-size: 1.8rem;
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.3s ease;
          z-index: 2;
        }

        .stat-card-emoji.show-emoji {
          opacity: 1;
          transform: scale(1);
        }

        .stat-card:hover .stat-card-emoji {
          opacity: 1;
          transform: scale(1);
        }

        .stat-card:hover .stat-icon i {
          opacity: 0;
          transform: scale(0.8);
        }

        .stat-card:hover .stat-icon {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(7, 7, 7, 0.3);
        }

        .stat-content h3 {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
          color: #090909ff;
        }

        .stat-content p {
          margin: 0;
          color: #030303ff;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .section-title {
          margin-bottom: 1.5rem;
          color: #2c3e50;
          font-weight: 600;
        }

        /* Admin Insights Styles */
        .admin-insights .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .insight-card {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .insight-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          border-color: #050505ff;
        }

        .insight-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1rem;
        }

        .insight-icon {
          position: relative;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .insight-emoji {
          position: absolute;
          font-size: 1.2rem;
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.3s ease;
          z-index: 2;
        }

        .insight-emoji.show-emoji {
          opacity: 1;
          transform: scale(1);
        }

        .insight-card:hover .insight-emoji {
          opacity: 1;
          transform: scale(1);
        }

        .insight-card:hover .insight-icon i {
          opacity: 0;
          transform: scale(0.8);
        }

        .insight-header i {
          font-size: 1.2rem;
          color: #0f0f0fff;
          transition: all 0.3s ease;
        }

        .insight-header h6 {
          margin: 0;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 0.5rem;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111212ff;
        }

        .metric-label {
          font-size: 0.8rem;
          color: #6c757d;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: #101010ff;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0a0b0bff, #0a0a0aff);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .activity-dot {
          width: 8px;
          height: 8px;
          background: #0c0c0cff;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .activity-content span {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .activity-content small {
          color: #6c757d;
          font-size: 0.75rem;
        }

        .insight-tip {
          background: rgba(255, 255, 255, 0.2);
          padding: 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-top: 1rem;
        }

        /* User Features Styles */
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .feature-card {
          position: relative;
          background: white;
          border-radius: 16px;
          padding: 2rem;
          text-decoration: none;
          color: inherit;
          overflow: hidden;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
          color: inherit;
        }

        .feature-card.primary:hover {
          border-color: #060606ff;
        }

        .feature-card.secondary:hover {
          border-color: #070707ff;
        }

        .feature-background {
          position: absolute;
          top: 0;
          right: 0;
          width: 100px;
          height: 100px;
          opacity: 0.1;
          overflow: hidden;
        }

        .feature-pattern {
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, #090909ff 2px, transparent 2px);
          background-size: 20px 20px;
          transform: rotate(45deg) translate(25%, -25%);
        }

        .feature-card.secondary .feature-pattern {
          background: radial-gradient(circle, #0e0f0eff 2px, transparent 2px);
          background-size: 20px 20px;
        }

        .feature-icon {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #101010ff, #0c0c0cff);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
          margin-bottom: 1rem;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .feature-emoji {
          position: absolute;
          font-size: 2rem;
          opacity: 0;
          transform: scale(0.8) rotate(-15deg);
          transition: all 0.3s ease;
          z-index: 2;
        }

        .feature-emoji.show-emoji {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }

        .feature-card:hover .feature-emoji {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }

        .feature-card:hover .feature-icon i {
          opacity: 0;
          transform: scale(0.8) rotate(15deg);
        }

        .feature-card:hover .feature-icon {
          transform: scale(1.1) rotate(-5deg);
          box-shadow: 0 8px 25px rgba(12, 13, 13, 0.4);
        }

        .feature-card.secondary .feature-icon {
          background: linear-gradient(135deg, #0f100fff, #0b0b0bff);
        }

        .feature-card.secondary:hover .feature-icon {
          box-shadow: 0 8px 25px rgba(4, 4, 4, 0.4);
        }

        .feature-content h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1.2rem;
          font-weight: 700;
          color: #2c3e50;
        }

        .feature-content p {
          margin: 0 0 1.5rem 0;
          color: #6c757d;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .feature-action {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #070707ff;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .feature-card.secondary .feature-action {
          color: #0e0e0eff;
        }

        .user-stats {
          margin-bottom: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }

        .stat-item .stat-icon {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #0b0b0bff, #070708ff);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.2rem;
          position: relative;
          transition: all 0.3s ease;
        }

        .stat-emoji {
          position: absolute;
          font-size: 1.3rem;
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.3s ease;
          z-index: 2;
        }

        .stat-emoji.show-emoji {
          opacity: 1;
          transform: scale(1);
        }

        .stat-item:hover .stat-emoji {
          opacity: 1;
          transform: scale(1);
        }

        .stat-item:hover .stat-icon i {
          opacity: 0;
          transform: scale(0.8);
        }

        .stat-item:hover .stat-icon {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(17, 17, 17, 0.4);
        }

        .stat-info h6 {
          margin: 0 0 4px 0;
          font-size: 0.8rem;
          color: #6c757d;
          font-weight: 600;
        }

        .stat-info span {
          font-size: 1.1rem;
          font-weight: 700;
          color: #2c3e50;
        }

        .tips-section {
          margin-top: 2rem;
        }

        .tip-card {
          background: linear-gradient(135deg, #e3f2fd 0%, #f8f9faff 100%);
          padding: 1.5rem;
          border-radius: 12px;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          border: 1px solid rgba(252, 252, 252, 0.2);
        }

        .tip-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .tip-content h6 {
          margin: 0 0 0.5rem 0;
          color: #0a0a0aff;
          font-weight: 700;
        }

        .tip-content p {
          margin: 0;
          color: #111212ff;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        @media (max-width: 991.98px) {
          .layout-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .sidebar {
            position: static;
            order: 2;
            margin-top: 1rem;
          }

          .content-area {
            order: 1;
          }

          .welcome-card {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .container {
            padding: 0 0.5rem;
          }
        }

        @media (max-width: 768px) {
          .title-content h1 {
            font-size: 1.5rem;
          }
          
          .main-layout {
            padding: 1rem 0;
          }

          .sidebar {
            padding: 1rem;
          }

          .content-area {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}