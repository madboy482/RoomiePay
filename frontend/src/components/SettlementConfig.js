import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField
} from '@mui/material';

const SettlementConfig = ({ open, onClose, onSave }) => {
    const [period, setPeriod] = useState('1d');
    const [customValue, setCustomValue] = useState('1');
    const [timeUnit, setTimeUnit] = useState('d');

    const handleSave = () => {
        if (period === 'custom') {
            onSave(`${customValue}${timeUnit}`);
        } else {
            onSave(period);
        }
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Configure Settlement Period</DialogTitle>
            <DialogContent>
                <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Settlement Period</InputLabel>
                    <Select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        label="Settlement Period"
                    >
                        <MenuItem value="1h">Every Hour</MenuItem>
                        <MenuItem value="1d">Daily</MenuItem>
                        <MenuItem value="1w">Weekly</MenuItem>
                        <MenuItem value="1m">Monthly</MenuItem>
                        <MenuItem value="custom">Custom</MenuItem>
                    </Select>
                </FormControl>

                {period === 'custom' && (
                    <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                        <TextField
                            type="number"
                            label="Value"
                            value={customValue}
                            onChange={(e) => setCustomValue(e.target.value)}
                            style={{ width: '100px' }}
                        />
                        <FormControl style={{ width: '120px' }}>
                            <InputLabel>Unit</InputLabel>
                            <Select
                                value={timeUnit}
                                onChange={(e) => setTimeUnit(e.target.value)}
                                label="Unit"
                            >
                                <MenuItem value="h">Hours</MenuItem>
                                <MenuItem value="d">Days</MenuItem>
                                <MenuItem value="w">Weeks</MenuItem>
                                <MenuItem value="m">Months</MenuItem>
                            </Select>
                        </FormControl>
                    </div>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default SettlementConfig;