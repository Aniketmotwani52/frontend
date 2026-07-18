import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../../../app/providers/AuthContext';
import { api } from '../../../shared/api/axios';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      // The backend returns { accessToken: "..." }
      login(response.data.accessToken);
      navigate('/'); // Redirect to dashboard on success
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError('Invalid username or password');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--secondary-light) 100%)',
      }}
    >
      <Box 
        component="form" 
        onSubmit={handleLogin}
        className="glass-panel"
        sx={{
          p: { xs: 4, md: 6 },
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--primary-main)' }}>
            SalonPro
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Sign in to your account
          </Typography>
        </Box>

        <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Demo Credentials:</Typography>
          <Typography variant="body2">Username: <strong>sarah</strong></Typography>
          <Typography variant="body2">Password: <strong>password</strong></Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
            * For the best experience, please use Desktop view.
          </Typography>
        </Alert>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Username"
          variant="outlined"
          fullWidth
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
        />
        
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />

        <Button 
          type="submit" 
          variant="contained" 
          size="large"
          disabled={isLoading}
          sx={{ mt: 2, height: 48 }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
        </Button>
      </Box>
    </Box>
  );
};
