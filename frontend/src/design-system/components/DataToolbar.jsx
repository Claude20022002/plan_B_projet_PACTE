import { Box, Button, InputAdornment, TextField } from '@mui/material';
import { Download, FilterList, Search } from '@mui/icons-material';

export default function DataToolbar({ search, onSearchChange, onFilterClick, onExport, children }) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2,
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      <TextField
        value={search}
        onChange={(event) => onSearchChange?.(event.target.value)}
        size="small"
        placeholder="Rechercher..."
        sx={{ width: { xs: '100%', md: 360 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', md: 'auto' }, justifyContent: 'flex-end' }}>
        {onFilterClick && (
          <Button variant="outlined" startIcon={<FilterList />} onClick={onFilterClick}>
            Filtres
          </Button>
        )}
        {onExport && (
          <Button variant="outlined" startIcon={<Download />} onClick={onExport}>
            Exporter
          </Button>
        )}
        {children}
      </Box>
    </Box>
  );
}

