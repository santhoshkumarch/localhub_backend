const pool = require('../config/database');

const getDashboardStats = async (req, res) => {
  try {
    // Check if tables exist first
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'businesses', 'posts')
    `);
    
    if (tablesResult.rows.length < 3) {
      // Return default data if tables don't exist
      return res.json({
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          totalBusinesses: 0,
          totalPosts: 0,
          pendingApprovals: 0
        },
        recentActivities: []
      });
    }

    // Get total users
    const usersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(usersResult.rows[0].total);

    // Get active users (last 7 days)
    const activeUsersResult = await pool.query(
      'SELECT COUNT(*) as active FROM users WHERE last_active >= NOW() - INTERVAL \'7 days\''
    );
    const activeUsers = parseInt(activeUsersResult.rows[0].active);

    // Get total businesses
    const businessesResult = await pool.query('SELECT COUNT(*) as total FROM businesses');
    const totalBusinesses = parseInt(businessesResult.rows[0].total);

    // Get total posts
    const postsResult = await pool.query('SELECT COUNT(*) as total FROM posts');
    const totalPosts = parseInt(postsResult.rows[0].total);

    // Get pending approvals (businesses + posts)
    const pendingBusinessesResult = await pool.query(
      'SELECT COUNT(*) as pending FROM businesses WHERE status = \'pending\''
    );
    const pendingPostsResult = await pool.query(
      'SELECT COUNT(*) as pending FROM posts WHERE status = \'pending\''
    );
    const pendingApprovals = parseInt(pendingBusinessesResult.rows[0].pending) + 
                            parseInt(pendingPostsResult.rows[0].pending);

    // Get recent activities
    const recentActivities = await getRecentActivities();

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalBusinesses,
        totalPosts,
        pendingApprovals
      },
      recentActivities
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    // Return default data on error
    res.json({
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        totalBusinesses: 0,
        totalPosts: 0,
        pendingApprovals: 0
      },
      recentActivities: []
    });
  }
};

const getRecentActivities = async () => {
  try {
    // Get recent user registrations
    const recentUsers = await pool.query(`
      SELECT 'user' as type, 'New user registered' as action, name as user, 
             created_at as time, 'N/A' as district
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC 
      LIMIT 3
    `);

    // Get recent business registrations
    const recentBusinesses = await pool.query(`
      SELECT 'business' as type, 'Business registered' as action, name as user,
             created_at as time, 'N/A' as district
      FROM businesses 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC 
      LIMIT 3
    `);

    // Get recent posts
    const recentPosts = await pool.query(`
      SELECT 'post' as type, 'New post published' as action, 
             COALESCE(b.name, u.name) as user, p.created_at as time, 'N/A' as district
      FROM posts p
      LEFT JOIN businesses b ON p.business_id = b.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY p.created_at DESC 
      LIMIT 3
    `);

    // Combine and sort activities
    const activities = [
      ...recentUsers.rows,
      ...recentBusinesses.rows,
      ...recentPosts.rows
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

    return activities.map((activity, index) => ({
      id: index + 1,
      type: activity.type,
      action: activity.action,
      user: activity.user,
      time: getTimeAgo(activity.time),
      district: activity.district
    }));
  } catch (error) {
    console.error('Recent activities error:', error);
    return [];
  }
};

const getTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

module.exports = { getDashboardStats };