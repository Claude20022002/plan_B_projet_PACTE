import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

export default function FormPropsTextFields() {
    return (
    <Box
        component="form"
        sx={{ '& .MuiTextField-root': { m: 1, width: '35ch' } }}
        noValidate
        autoComplete="off"
    >
        <div>
        <TextField
            id="outlined-password-input"
            label="Password"
            type="password"
            autoComplete="current-password"
        />
        </div>
    </Box>
    );
}
