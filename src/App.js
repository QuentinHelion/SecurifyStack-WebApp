import { CssBaseline, ThemeProvider } from '@mui/material';
import {useRoutes, useLocation, useNavigate} from 'react-router-dom';
import Router from './routes/Router';
import Cookies from 'js-cookie';

import { baselightTheme } from "./theme/DefaultColors";

function App() {
  const routing = useRoutes(Router);
  const theme = baselightTheme;
  const location = useLocation();
  const navigate = useNavigate();
  if(Cookies.get('token') == null && location.pathname !== '/auth/login') {
    navigate('/auth/login');
  }
  return (
    <ThemeProvider theme={theme}>

      <CssBaseline />
      {routing}

    </ThemeProvider>
  );
}

export default App;
