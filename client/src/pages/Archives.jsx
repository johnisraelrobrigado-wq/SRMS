import { Typography, Box, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Description, Upload, Download, Delete } from '@mui/icons-material';

const Archives = () => {
  const mockArchives = [
    { id: 1, title: '2025 Barangay Budget', category: 'Finance', uploaded: '2025-01-15' },
    { id: 2, title: 'Session Minutes - January', category: 'Meetings', uploaded: '2025-01-20' },
    { id: 3, title: 'Project Reports 2024', category: 'Projects', uploaded: '2024-12-31' }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600} color="#1e293b">
          Archives
        </Typography>
        <Button
          variant="contained"
          startIcon={<Upload />}
          sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}
        >
          Upload Document
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Date Uploaded</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockArchives.map((file) => (
              <TableRow key={file.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Description color="action" />
                    {file.title}
                  </Box>
                </TableCell>
                <TableCell>{file.category}</TableCell>
                <TableCell>{file.uploaded}</TableCell>
                <TableCell>
                  <Button size="small" startIcon={<Download />}>Download</Button>
                  <Button size="small" startIcon={<Delete />} color="error">
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Archives;
