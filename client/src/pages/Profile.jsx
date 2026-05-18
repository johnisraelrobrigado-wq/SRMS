import { useState, useEffect } from 'react';
import { Typography, Box, Paper, CircularProgress, Grid, TextField } from '@mui/material';
import { Person, Email, Badge, Home } from '@mui/icons-material';
import api from '../services/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('auth/me');
      const userData = response.data.user;
      setUser(userData);
      if (userData.resident) {
        setResident(userData.resident);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} color="#1e293b" mb={3}>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '36px'
              }}
            >
              {user?.fullName?.charAt(0) || 'U'}
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                {user?.fullName}
              </Typography>
              <Typography variant="body1" color="#64748b">
                {user?.role}
              </Typography>
              <Typography variant="body2" color="#94a3b8" sx={{ mt: 0.5 }}>
                @{user?.username}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Account Details */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2} color="#1e293b">
              Account Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Person sx={{ color: '#64748b' }} />
                <Box>
                  <Typography variant="body2" color="#64748b">Full Name</Typography>
                  <Typography variant="body1">{user?.fullName}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Badge sx={{ color: '#64748b' }} />
                <Box>
                  <Typography variant="body2" color="#64748b">Username</Typography>
                  <Typography variant="body1">{user?.username}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Email sx={{ color: '#64748b' }} />
                <Box>
                  <Typography variant="body2" color="#64748b">Email</Typography>
                  <Typography variant="body1">{user?.email || 'Not provided'}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 24, color: '#64748b' }}>
                  <i className="fas fa-user-tag" />
                </Box>
                <Box>
                  <Typography variant="body2" color="#64748b">Role</Typography>
                  <Typography variant="body1">{user?.role}</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Resident Details */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2} color="#1e293b">
              Resident Information
            </Typography>
            {resident ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Person sx={{ color: '#64748b' }} />
                  <Box>
                    <Typography variant="body2" color="#64748b">Full Name</Typography>
                    <Typography variant="body1">{resident.full_name}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 24, color: '#64748b' }}>
                    <i className="fas fa-calendar" />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="#64748b">Birthdate</Typography>
                    <Typography variant="body1">{new Date(resident.birthdate).toLocaleDateString()}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 24, color: '#64748b' }}>
                    <i className="fas fa-venus-mars" />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="#64748b">Gender</Typography>
                    <Typography variant="body1">{resident.gender}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Home sx={{ color: '#64748b' }} />
                  <Box>
                    <Typography variant="body2" color="#64748b">Address</Typography>
                    <Typography variant="body1">{resident.address}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 24, color: '#64748b' }}>
                    <i className="fas fa-map-pin" />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="#64748b">Purok</Typography>
                    <Typography variant="body1">{resident.purok}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 24, color: '#64748b' }}>
                    <i className="fas fa-briefcase" />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="#64748b">Occupation</Typography>
                    <Typography variant="body1">{resident.occupation || 'Not provided'}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 24, color: '#64748b' }}>
                    <i className="fas fa-rings-wedding" />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="#64748b">Civil Status</Typography>
                    <Typography variant="body1">{resident.civil_status}</Typography>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="#64748b">
                No resident profile linked to this account.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
