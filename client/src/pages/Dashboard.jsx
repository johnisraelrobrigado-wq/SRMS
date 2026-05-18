import { useState, useEffect } from 'react';
import { Typography, Box, Grid, Paper, CircularProgress } from '@mui/material';
import { People, FolderOpen, Description } from '@mui/icons-material';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ residents: 0, projects: 0, requests: 0 });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

   useEffect(() => {
     const fetchData = async () => {
       try {
         // Fetch residents count
         const residentsRes = await api.get('residents');
         setStats(prev => ({ ...prev, residents: residentsRes.data.pagination.total }));

         // Fetch projects count
         const projectsRes = await api.get('projects');
         setStats(prev => ({ ...prev, projects: projectsRes.data.projects.length }));

         // Fetch requests count
         const requestsRes = await api.get('documents');
         setStats(prev => ({ ...prev, requests: requestsRes.data.requests.filter(r => r.status === 'PENDING').length }));

         // Fetch recent activities
         const activitiesRes = await api.get('activity/dashboard');
         setActivities(activitiesRes.data.recent || []);
       } catch (err) {
         console.error('Failed to fetch dashboard data', err);
       } finally {
         setLoading(false);
       }
     };

     fetchData();
   }, []);

  const getActivityColor = (action) => {
    if (action.includes('resident')) return 'blue';
    if (action.includes('document')) return 'green';
    if (action.includes('project')) return 'orange';
    return 'gray';
  };

  return (
    <Box>
      {/* Topbar */}
      <Box
        sx={{
          background: 'white',
          padding: '20px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <Typography variant="h4" fontWeight={600} color="#1e293b">
          BARANGAY INFORMATION MANAGEMENT SYSTEM
        </Typography>
        <a href="/" style={{ textDecoration: 'none' }}>
          <Box
            component="button"
            sx={{
              bgcolor: '#1e293b',
              color: 'white',
              px: 3,
              py: 1,
              borderRadius: 1,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            HOME
          </Box>
        </a>
      </Box>

      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <Typography variant="h5" fontWeight={600} color="#1e293b" mb={1}>
            Welcome!
          </Typography>
          <Typography variant="body1" color="#64748b" mb={4}>
            Use the sidebar to navigate through the system modules.
          </Typography>

          {/* Stats Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  bgcolor: '#eff6ff',
                  borderLeft: '4px solid #3b82f6'
                }}
              >
                <People sx={{ fontSize: 40, color: '#3b82f6' }} />
                <Box>
                  <Typography variant="h3" fontWeight={700} color="#1e293b">
                    {loading ? <CircularProgress size={24} /> : stats.residents}
                  </Typography>
                  <Typography variant="body2" color="#64748b">Total Residents</Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  bgcolor: '#f0fdf4',
                  borderLeft: '4px solid #16a34a'
                }}
              >
                <FolderOpen sx={{ fontSize: 40, color: '#16a34a' }} />
                <Box>
                  <Typography variant="h3" fontWeight={700} color="#1e293b">
                    {loading ? <CircularProgress size={24} /> : stats.projects}
                  </Typography>
                  <Typography variant="body2" color="#64748b">Active Projects</Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  bgcolor: '#fff7ed',
                  borderLeft: '4px solid #f97316'
                }}
              >
                <Description sx={{ fontSize: 40, color: '#f97316' }} />
                <Box>
                  <Typography variant="h3" fontWeight={700} color="#1e293b">
                    {loading ? <CircularProgress size={24} /> : stats.requests}
                  </Typography>
                  <Typography variant="body2" color="#64748b">Pending Requests</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Recent Activities */}
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'white' }}>
            <Typography variant="h6" fontWeight={600} color="#1e293b" mb={2}>
              Recent Activities
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : activities.length > 0 ? (
              <Box>
                {activities.map((activity, index) => (
                  <Box
                    key={activity.id || index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 2,
                      borderBottom: index < activities.length - 1 ? '1px solid #f1f5f9' : 'none'
                    }}
                  >
                    <Typography variant="body2" color="#1e293b">
                      {activity.action}
                      {activity.details && `: ${activity.details}`}
                    </Typography>
                    <Typography variant="caption" color="#94a3b8">
                      {new Date(activity.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="#64748b" textAlign="center" py={4}>
                No recent activities
              </Typography>
            )}
          </Paper>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
