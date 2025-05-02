import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    List, 
    ListItem, 
    ListItemText, 
    Button, 
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Divider
} from '@mui/material';
import { getPendingSettlements, confirmSettlement } from '../services/api';

const Settlements = () => {
    const [settlements, setSettlements] = useState([]);
    const [selectedSettlement, setSelectedSettlement] = useState(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('');
    const currentUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        loadSettlements();
    }, []);

    const loadSettlements = async () => {
        try {
            const response = await getPendingSettlements(currentUser.UserID);
            setSettlements(response.data);
        } catch (error) {
            console.error('Failed to load settlements:', error);
        }
    };

    const handlePaymentClick = (settlement) => {
        setSelectedSettlement(settlement);
        setShowPaymentDialog(true);
    };

    const handleConfirmPayment = async () => {
        try {
            await confirmSettlement(selectedSettlement.SettlementID, paymentMethod);
            setShowPaymentDialog(false);
            setPaymentMethod('');
            loadSettlements(); // Refresh settlements list
        } catch (error) {
            console.error('Failed to confirm payment:', error);
            alert('Failed to confirm payment');
        }
    };

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                Pending Settlements
            </Typography>

            <List>
                {settlements.map((settlement) => (
                    <Paper key={settlement.SettlementID} elevation={2} sx={{ mb: 2 }}>
                        <ListItem>
                            <ListItemText
                                primary={
                                    <Typography variant="h6">
                                        Amount: ${Number(settlement.Amount).toFixed(2)}
                                    </Typography>
                                }
                                secondary={
                                    <>
                                        <Typography component="span" variant="body2">
                                            {settlement.PayerUserID === currentUser.UserID ? 
                                                'You need to pay' : 
                                                'You will receive payment'}
                                        </Typography>
                                        <br />
                                        <Typography component="span" variant="body2">
                                            Due by: {new Date(settlement.DueDate).toLocaleDateString()}
                                        </Typography>
                                        {settlement.Status === 'Pending' && settlement.PayerUserID === currentUser.UserID && (
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                sx={{ mt: 1 }}
                                                onClick={() => handlePaymentClick(settlement)}
                                            >
                                                Make Payment
                                            </Button>
                                        )}
                                    </>
                                }
                            />
                        </ListItem>
                    </Paper>
                ))}
                {settlements.length === 0 && (
                    <Typography variant="body1" color="textSecondary">
                        No pending settlements
                    </Typography>
                )}
            </List>

            {/* Payment Dialog */}
            <Dialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)}>
                <DialogTitle>Confirm Payment</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        Amount to pay: ${selectedSettlement?.Amount.toFixed(2)}
                    </Typography>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Payment Method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        placeholder="e.g., UPI, Bank Transfer, Cash"
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
                    <Button 
                        onClick={handleConfirmPayment}
                        variant="contained"
                        disabled={!paymentMethod}
                    >
                        Confirm Payment
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Settlements;