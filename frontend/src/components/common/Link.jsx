import * as React from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

const preventDefault = (event) => event.preventDefault();

export default function Links({label}) {
    return (
    <Box
        sx={{
        typography: 'body1',
        '& > :not(style) ~ :not(style)': {
        ml: 2,
        },
    }}
    onClick={preventDefault}
    >
    <Link href="#">{label}</Link>
    </Box>);
}
