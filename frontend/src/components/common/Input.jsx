import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

export default function FormPropsTextFields({placeholder}) {
    return (
    <Box
        component="form"
        sx={{ '& .MuiTextField-root': { m: 1, width: '35ch' } }}
        noValidate
        autoComplete="off"
    >
        <div>
        <TextField
            required
            id="outlined-required"
            label="Email"
            defaultValue=""
            placeholder={placeholder}
        />
        </div>
    </Box>
    );
}
