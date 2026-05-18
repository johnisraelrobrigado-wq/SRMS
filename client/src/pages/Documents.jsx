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
  Grid,
  Alert
} from '@mui/material';
import { Add, Update } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Documents = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    type: '',
    purpose: '',
    file_path: ''
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('documents');
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setFormData({ type: '', purpose: '' });
    setFile(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
  };

  const handleSubmit = async () => {
    try {
      setError('');
      const submitData = new FormData();
      submitData.append('type', formData.type);
      submitData.append('purpose', formData.purpose);
      if (file) {
        submitData.append('file', file);
      }

      await api.post('documents', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      handleClose();
      fetchRequests();
    } catch (error) {
      console.error('Failed to submit request:', error);
      setError(error.response?.data?.error || 'Failed to submit request');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`documents/${id}/status`, { status });
      fetchRequests();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'RELEASED': return 'info';
      default: return 'default';
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
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600} color="#1e293b">
          Document Requests
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
          sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}
        >
          New Request
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Purpose</TableCell>
              <TableCell>Resident</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Attachment</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id} hover>
                <TableCell>{request.type}</TableCell>
                <TableCell>{request.purpose}</TableCell>
                <TableCell>{request.resident?.full_name}</TableCell>
                <TableCell>{new Date(request.request_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip
                    label={request.status}
                    size="small"
                    color={getStatusColor(request.status)}
                  />
                </TableCell>
                <TableCell>
                  {request.file_path ? (
                    <Button
                      size="small"
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${request.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View File
                    </Button>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {user?.role === 'ADMIN' ? (
                    request.status === 'PENDING' ? (
                      <>
                        <Button
                          size="small"
                          onClick={() => handleStatusUpdate(request.id, 'APPROVED')}
                          sx={{ mr: 1, color: '#16a34a' }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          onClick={() => handleStatusUpdate(request.id, 'REJECTED')}
                          sx={{ color: '#dc2626' }}
                        >
                          Reject
                        </Button>
                      </>
                    ) : request.status === 'APPROVED' ? (
                      <Button
                        size="small"
                        onClick={() => handleStatusUpdate(request.id, 'RELEASED')}
                        sx={{ color: '#0369a1' }}
                      >
                        Mark Released
                      </Button>
                    ) : null
                  ) : (
                    <Typography variant="body2" color="#64748b">
                      {request.status}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* New Request Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>New Document Request</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={formData.type}
                label="Document Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="Barangay Clearance">Barangay Clearance</MenuItem>
                <MenuItem value="Certificate of Indigency">Certificate of Indigency</MenuItem>
                <MenuItem value="Barangay Residency">Barangay Residency</MenuItem>
                <MenuItem value="Building Permit">Building Permit</MenuItem>
                <MenuItem value="Business Permit">Business Permit</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Purpose"
              fullWidth
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              multiline
              rows={3}
            />
            <Button
              variant="outlined"
              component="label"
              sx={{ textAlign: 'left', justifyContent: 'flex-start' }}
            >
              {file ? file.name : 'Attach File (optional)'}
              <input
                type="file"
                hidden
                onChange={(e) => setFile(e.target.files[0])}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#1e293b' }}>
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Documents;
