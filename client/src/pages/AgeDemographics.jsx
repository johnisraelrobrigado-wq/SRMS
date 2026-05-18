import { useState, useEffect } from 'react';
import { Typography, Box, Paper, CircularProgress, Grid } from '@mui/material';
import { People, Timeline, PieChart } from '@mui/icons-material';
import api from '../services/api';

const AgeDemographics = () => {
  const [demographics, setDemographics] = useState({ children: 0, adults: 0, seniors: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDemographics();
  }, []);

  const fetchDemographics = async () => {
    try {
      // Would fetch actual grouped data from backend
      // Mock data for now
      setDemographics({
        children: 45,
        adults: 156,
        seniors: 46
      });
    } catch (error) {
      console.error('Failed to fetch demographics:', error);
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

  const total = demographics.children + demographics.adults + demographics.seniors;
  const childrenPct = ((demographics.children / total) * 100).toFixed(1);
  const adultsPct = ((demographics.adults / total) * 100).toFixed(1);
  const seniorsPct = ((demographics.seniors / total) * 100).toFixed(1);

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} color="#1e293b" mb={3}>
        Age Demographics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center', bgcolor: '#eff6ff' }}>
            <People sx={{ fontSize: 48, color: '#3b82f6', mb: 1 }} />
            <Typography variant="h3" fontWeight={700}>{demographics.children}</Typography>
            <Typography variant="body2" color="#64748b">Children (0-17)</Typography>
            <Typography variant="body1" color="#3b82f6" fontWeight={600}>{childrenPct}%</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center', bgcolor: '#f0fdf4' }}>
            <Timeline sx={{ fontSize: 48, color: '#16a34a', mb: 1 }} />
            <Typography variant="h3" fontWeight={700}>{demographics.adults}</Typography>
            <Typography variant="body2" color="#64748b">Adults (18-59)</Typography>
            <Typography variant="body1" color="#16a34a" fontWeight={600}>{adultsPct}%</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center', bgcolor: '#fff7ed' }}>
            <PieChart sx={{ fontSize: 48, color: '#f97316', mb: 1 }} />
            <Typography variant="h3" fontWeight={700}>{demographics.seniors}</Typography>
            <Typography variant="body2" color="#64748b">Seniors (60+)</Typography>
            <Typography variant="body1" color="#f97316" fontWeight={600}>{seniorsPct}%</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>Population Distribution</Typography>
        <Box sx={{ height: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', pt: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: `${(demographics.children / total) * 250}px`,
                bgcolor: '#3b82f6',
                borderRadius: '8px 8px 0 0'
              }}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>Children</Typography>
            <Typography variant="body1" fontWeight={600}>{childrenPct}%</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: `${(demographics.adults / total) * 250}px`,
                bgcolor: '#16a34a',
                borderRadius: '8px 8px 0 0'
              }}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>Adults</Typography>
            <Typography variant="body1" fontWeight={600}>{adultsPct}%</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: `${(demographics.seniors / total) * 250}px`,
                bgcolor: '#f97316',
                borderRadius: '8px 8px 0 0'
              }}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>Seniors</Typography>
            <Typography variant="body1" fontWeight={600}>{seniorsPct}%</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default AgeDemographics;
