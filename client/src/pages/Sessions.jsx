import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Grid
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Sessions = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    attendees: ''
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await api.get('sessions');
      setSessions(response.data.sessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (session = null) => {
    if (session) {
      setEditing(session);
      setFormData({
        title: session.title,
        description: session.description || '',
        date: session.date?.split('T')[0],
        time: session.time,
        location: session.location,
        attendees: session.attendees || ''
      });
    } else {
      setEditing(null);
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        attendees: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    try {
      if (!isAdmin) return;
      if (editing) {
        await api.put(`sessions/${editing.session_id}`, formData);
      } else {
        await api.post('sessions', formData);
      }
      handleClose();
      fetchSessions();
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      await api.delete(`sessions/${id}`);
      fetchSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600} color="#1e293b">
          Barangay Sessions
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
            sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}
          >
            Schedule Session
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {sessions.map((session) => (
          <Grid item xs={12} md={6} key={session.session_id}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid #f1f5f9',
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" fontWeight={700} color="#1e293b">
                  {session.title}
                </Typography>
                 <Box>
                  {isAdmin && (
                    <>
                      <IconButton size="small" onClick={() => handleOpen(session)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(session.session_id)} color="error">
                        <Delete fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
              </Box>
              <Typography variant="body2" color="#64748b">
                {session.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1, fontSize: '13px', color: '#64748b' }}>
                <span><i className="far fa-calendar" /> {new Date(session.date).toLocaleDateString()}</span>
                <span><i className="far fa-clock" /> {session.time}</span>
                <span><i className="fas fa-map-marker-alt" /> {session.location}</span>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Session' : 'Schedule New Session'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Title"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              label="Date"
              type="date"
              fullWidth
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Time"
              type="time"
              fullWidth
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Location"
              fullWidth
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#1e293b' }}>
            {editing ? 'Update' : 'Schedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sessions;
