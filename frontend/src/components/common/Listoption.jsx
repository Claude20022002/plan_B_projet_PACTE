import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

const options = ['Administrateur', 'Professeur', 'Etudiant'];

export default function ControllableStates() {
    const [value, setValue] = React.useState(options[0]);
    const [inputValue, setInputValue] = React.useState('');

    return (
    <div>
    <Autocomplete
        value={value}
        onChange={(event, newValue) => {
            setValue(newValue);
        }}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
        }}
        id="controllable-states-demo"
        options={options}
        sx={{ width: 300 }}
        renderInput={(params) => <TextField {...params} label="Fonction" />}
        />
    </div>
    );
}
