import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Paper,
    Grid,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    Alert,
    Divider,
    CircularProgress
} from '@mui/material';
import { processPayment } from '../services/api';

const PaymentPortal = ({ open, onClose, settlement, onPaymentComplete }) => {
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [paymentDetails, setPaymentDetails] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handlePaymentSubmit = async () => {
        setLoading(true);
        setError('');
        
        try {
            await processPayment(settlement.SettlementID, settlement.Amount);
            setShowConfirmation(true);
            if (onPaymentComplete) {
                onPaymentComplete();
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to process payment');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setPaymentMethod('upi');
        setPaymentDetails('');
        setError('');
        setShowConfirmation(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!settlement) return null;

    // Convert Amount to number for toFixed
    const amount = Number(settlement.Amount);

    if (showConfirmation) {
        return (
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogContent>
                    <Box textAlign="center" py={3}>
                        <Typography variant="h6" color="success.main" gutterBottom>
                            Payment Successful!
                        </Typography>
                        <Typography variant="body1">
                            Amount: ${amount.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Transaction ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={handleClose}
                            sx={{ mt: 3 }}
                        >
                            Close
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>Payment Portal</DialogTitle>
            <DialogContent>
                <Grid container spacing={3}>
                    {/* Payment Summary */}
                    <Grid item xs={12}>
                        <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                            <Typography variant="h6" gutterBottom>
                                Payment Summary
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Amount Due:
                                    </Typography>
                                    <Typography variant="h5" color="primary.main">
                                        ${amount.toFixed(2)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Due Date:
                                    </Typography>
                                    <Typography variant="body1">
                                        {new Date(settlement.DueDate).toLocaleDateString()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="body2">
                                        To: {settlement.ReceiverName}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Payment Methods */}
                    <Grid item xs={12}>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">Select Payment Method</FormLabel>
                            <RadioGroup
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                                <FormControlLabel
                                    value="upi"
                                    control={<Radio />}
                                    label="UPI Payment"
                                />
                                <FormControlLabel
                                    value="card"
                                    control={<Radio />}
                                    label="Credit/Debit Card"
                                />
                                <FormControlLabel
                                    value="netbanking"
                                    control={<Radio />}
                                    label="Net Banking"
                                />
                                <FormControlLabel
                                    value="wallet"
                                    control={<Radio />}
                                    label="Digital Wallet"
                                />
                            </RadioGroup>
                        </FormControl>
                    </Grid>

                    {/* Payment Details Input */}
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label={
                                paymentMethod === 'upi' ? 'Enter UPI ID' :
                                paymentMethod === 'card' ? 'Enter Card Number' :
                                paymentMethod === 'netbanking' ? 'Enter Bank Account Number' :
                                'Enter Wallet ID'
                            }
                            value={paymentDetails}
                            onChange={(e) => setPaymentDetails(e.target.value)}
                            variant="outlined"
                            required
                        />
                    </Grid>

                    {error && (
                        <Grid item xs={12}>
                            <Alert severity="error">{error}</Alert>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handlePaymentSubmit}
                    disabled={loading || !paymentDetails}
                    startIcon={loading && <CircularProgress size={20} />}
                >
                    Pay ${amount.toFixed(2)}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PaymentPortal;