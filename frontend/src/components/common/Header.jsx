import Buton from "./Buton";
import React from 'react'
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { NavLink } from 'react-router-dom';

// MUI theming example (not used currently)
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#001962',
    },
      secondary: {
      main: '#9747FF',
  },
  hover: {
      default: '#6B91FF',
    },

}
});

export default function Header() {
  return (
       
            <Box  sx={{ flexGrow: 1, backgroundColor: 'white' }}>
                  <AppBar color="white" sx={{ boxShadow: 'none', pt: 2, px: 6 }} position="static">
                  <Toolbar sx={{display: 'flex', justifyContent: 'space-between' }}>

                  {/* Logo */}
                  
                        <Box 
                              component="img"
                              src="/logo.png"
                              alt="Logo"
                              sx={{width: { xs: '160px', md: '220px' }, height: { xs: '40px', md: '60px' }}}   
                        />
                       
                        {/* connexion button */}
                         <ThemeProvider theme={theme}>
                              <Buton
                              component={NavLink}
                              to="/connexion"
                              color="primary"
                              label="Connexion"
                              />
                        </ThemeProvider>

          
                  </Toolbar>
                  </AppBar>
            </Box>
      
  );
}


// }
