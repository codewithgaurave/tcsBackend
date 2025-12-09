import Blog from '../models/Blog.js';
import Application from '../models/Application.js';
import Contact from '../models/Contact.js';

// @desc    Get all dashboard counts in single API call
// @route   GET /api/dashboard/counts
// @access  Private/Admin
export const getDashboardCounts = async (req, res) => {
  try {
    // Execute all count queries in parallel for maximum performance
    const [
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      featuredBlogs,
      totalApplications,
      newApplications,
      reviewedApplications,
      hiredApplications,
      totalContacts,
      newContacts,
      readContacts,
      totalViews,
      totalComments,
      totalLikes,
      recentBlogs,
      recentApplications
    ] = await Promise.all([
      // Blog counts
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'published' }),
      Blog.countDocuments({ status: 'draft' }),
      Blog.countDocuments({ featured: true }),
      
      // Application counts
      Application.countDocuments(),
      Application.countDocuments({ status: 'new' }),
      Application.countDocuments({ status: 'reviewed' }),
      Application.countDocuments({ status: 'hired' }),
      
      // Contact counts (if you have contact model)
      Contact.countDocuments(),
      Contact.countDocuments({ status: 'new' }),
      Contact.countDocuments({ status: 'read' }),
      
      // Engagement metrics
      Blog.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      Blog.aggregate([{ $group: { _id: null, total: { $sum: '$comments' } } }]),
      Blog.aggregate([{ $group: { _id: null, total: { $sum: '$likes' } } }]),
      
      // Recent activities data
      Blog.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title status createdAt updatedAt')
        .lean(),
      
      Application.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name position status createdAt')
        .lean()
    ]);

    // Calculate engagement rate
    const engagementRate = calculateEngagementRate(totalViews[0]?.total || 0, totalComments[0]?.total || 0, totalLikes[0]?.total || 0, totalBlogs);

    // Prepare recent activities
    const recentActivities = prepareRecentActivities(recentBlogs, recentApplications);

    // Category-wise blog distribution
    const blogsByCategory = await Blog.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Applications by position
    const applicationsByPosition = await Application.aggregate([
      {
        $group: {
          _id: '$position',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Last 30 days growth
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const last30DaysStats = await Promise.all([
      Blog.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Application.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Contact.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    // Popular blogs (top 5 by views)
    const popularBlogs = await Blog.find({ status: 'published' })
      .sort({ views: -1 })
      .limit(5)
      .select('title views comments likes category')
      .lean();

    // Response data
    const dashboardData = {
      success: true,
      data: {
        // Basic counts
        counts: {
          blogs: {
            total: totalBlogs,
            published: publishedBlogs,
            draft: draftBlogs,
            featured: featuredBlogs
          },
          applications: {
            total: totalApplications,
            new: newApplications,
            reviewed: reviewedApplications,
            hired: hiredApplications
          },
          contacts: {
            total: totalContacts || 0,
            new: newContacts || 0,
            read: readContacts || 0
          }
        },
        
        // Engagement metrics
        engagement: {
          totalViews: totalViews[0]?.total || 0,
          totalComments: totalComments[0]?.total || 0,
          totalLikes: totalLikes[0]?.total || 0,
          engagementRate: engagementRate,
          averageViewsPerPost: totalBlogs > 0 ? Math.round((totalViews[0]?.total || 0) / totalBlogs) : 0,
          averageCommentsPerPost: totalBlogs > 0 ? ((totalComments[0]?.total || 0) / totalBlogs).toFixed(1) : 0
        },
        
        // Distribution data
        distribution: {
          blogsByCategory: blogsByCategory,
          applicationsByPosition: applicationsByPosition
        },
        
        // Growth metrics
        growth: {
          last30Days: {
            newBlogs: last30DaysStats[0],
            newApplications: last30DaysStats[1],
            newContacts: last30DaysStats[2]
          },
          popularBlogs: popularBlogs
        },
        
        // Recent activities
        recentActivities: recentActivities,
        
        // Timestamp
        lastUpdated: new Date().toISOString()
      }
    };

    res.status(200).json(dashboardData);

  } catch (error) {
    console.error('Dashboard counts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard counts',
      error: error.message
    });
  }
};

// Helper function to calculate engagement rate
const calculateEngagementRate = (totalViews, totalComments, totalLikes, totalBlogs) => {
  if (totalBlogs === 0) return 0;
  
  // Simple engagement formula: (views + comments*10 + likes*5) / number of posts
  const totalEngagement = totalViews + (totalComments * 10) + (totalLikes * 5);
  const engagementRate = Math.min(Math.round((totalEngagement / totalBlogs) / 10), 100);
  
  return engagementRate;
};

// Helper function to prepare recent activities
const prepareRecentActivities = (recentBlogs, recentApplications) => {
  const activities = [];

  // Add blog activities
  recentBlogs.forEach(blog => {
    activities.push({
      id: blog._id,
      type: 'blog',
      title: getBlogActivityTitle(blog),
      description: blog.title,
      time: blog.updatedAt || blog.createdAt,
      icon: 'FileText',
      color: 'text-blue-500',
      status: blog.status
    });
  });

  // Add application activities
  recentApplications.forEach(app => {
    activities.push({
      id: app._id,
      type: 'application',
      title: 'New Job Application',
      description: `${app.name} - ${app.position}`,
      time: app.createdAt,
      icon: 'Briefcase',
      color: 'text-green-500',
      status: app.status
    });
  });

  // Sort by time and return latest 8 activities
  return activities
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 8)
    .map(activity => ({
      ...activity,
      time: formatTimeAgo(activity.time),
      timestamp: activity.time
    }));
};

// Helper function to get blog activity title
const getBlogActivityTitle = (blog) => {
  if (blog.status === 'published') {
    return 'New Blog Published';
  } else if (blog.status === 'draft') {
    return 'Blog Draft Saved';
  } else {
    return 'Blog Updated';
  }
};

// Helper function to format time ago
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
};