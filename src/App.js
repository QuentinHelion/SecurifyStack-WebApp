import { CssBaseline, ThemeProvider } from '@mui/material';
import {useRoutes, useLocation, useNavigate} from 'react-router-dom';
import Router from './routes/Router';
import { useEffect } from 'react';
import Cookies from 'js-cookie';
import { SnackbarProvider } from 'notistack';

import { baselightTheme } from "./theme/DefaultColors";

function App() {
  const routing = useRoutes(Router);
  const theme = baselightTheme;
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (Cookies.get('token') == null && location.pathname !== '/auth/login') {
      navigate('/auth/login');
    }
  }, [location, navigate]);

  return (
    <ThemeProvider theme={theme}>

      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        {routing}
      </SnackbarProvider>

    </ThemeProvider>
  );
}

export default App;
