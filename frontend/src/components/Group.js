import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Button, Typography, Paper, Dialog, TextField,
    List, ListItem, ListItemText, Divider, FormControl, InputLabel, Select, MenuItem, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    getGroupExpenses,
    getGroupBalances,
    addExpense,
    getSettlementSummary,
    setSettlementPeriod,
    finalizeGroupSplits
} from '../services/api';
import SettlementConfig from './SettlementConfig';
import PaymentPortal from './PaymentPortal';

const Group = () => {
    const { groupId } = useParams();
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState({ Members: [] });
    const [openAddExpense, setOpenAddExpense] = useState(false);
    const [openSettleConfig, setOpenSettleConfig] = useState(false);
    const [timeFilter, setTimeFilter] = useState('all');
    const [settlementSummary, setSettlementSummary] = useState(null);
    const [expenseForm, setExpenseForm] = useState({
        Amount: '',
        Description: '',
        SplitType: 'EQUAL',
        PaidByUserID: JSON.parse(localStorage.getItem('user'))?.UserID
    });
    const [settlementPeriod, setSettlementPeriodState] = useState('1m'); // Default 1 month
    const [showSettlementConfig, setShowSettlementConfig] = useState(false);
    const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
    const [finalizedSettlements, setFinalizedSettlements] = useState(null);
    const [selectedSettlement, setSelectedSettlement] = useState(null);
    const [showPaymentPortal, setShowPaymentPortal] = useState(false);

    useEffect(() => {
        loadGroupData();
    }, [groupId, timeFilter]);

    const loadGroupData = async () => {
        try {
            const [expensesRes, balancesRes, summaryRes] = await Promise.all([
                getGroupExpenses(groupId, timeFilter !== 'all' ? timeFilter : null),
                getGroupBalances(groupId),
                getSettlementSummary(`/groups/${groupId}/settlements/summary${timeFilter !== 'all' ? `?period=${timeFilter}` : ''}`)
            ]);
            
            setExpenses(expensesRes.data);
            setBalances(balancesRes.data);
            setSettlementSummary(summaryRes.data);
        } catch (error) {
            console.error('Failed to load group data:', error);
        }
    };

    const handleTimeFilterChange = (event) => {
        setTimeFilter(event.target.value);
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        const expenseData = {
            GroupID: parseInt(groupId),
            Amount: parseFloat(expenseForm.Amount),
            Description: expenseForm.Description,
            PaidByUserID: JSON.parse(localStorage.getItem('user'))?.UserID,
            SplitType: 'EQUAL',
            Splits: null  // Required by the schema but not used for equal splits
        };
        console.log('Sending expense data:', expenseData);
        try {
            await addExpense(expenseData);
            setOpenAddExpense(false);
            loadGroupData();
        } catch (error) {
            console.error('Failed to add expense:', error.response?.data || error);
            alert('Failed to add expense');
        }
    };

    const handleSettlementPeriodChange = async (period) => {
        try {
            await setSettlementPeriod(groupId, period);
            alert('Settlement period updated successfully');
        } catch (error) {
            console.error('Failed to update settlement period:', error);
            alert('Failed to update settlement period');
        }
    };

    const handleSettlementPeriodSave = async (period) => {
        try {
            await setSettlementPeriod(groupId, period);
            alert('Settlement period configured successfully');
        } catch (error) {
            console.error('Failed to set settlement period:', error);
            alert('Failed to configure settlement period');
        }
    };

    const handleFinalizeSplits = async () => {
        try {
            const response = await finalizeGroupSplits(groupId);
            setFinalizedSettlements(response.data);
            setShowFinalizeDialog(true);
            loadGroupData(); // Refresh data after finalizing
        } catch (error) {
            console.error('Failed to finalize splits:', error);
            alert(error.response?.data?.detail || 'Failed to finalize splits');
        }
    };

    const handlePayNow = (settlement) => {
        setSelectedSettlement(settlement);
        setShowPaymentPortal(true);
    };

    const handlePaymentComplete = () => {
        setShowPaymentPortal(false);
        loadGroupData(); // Refresh the data after payment
    };

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Group Expenses</Typography>
                <Box>
                    <Button 
                        variant="outlined" 
                        onClick={() => setShowSettlementConfig(true)}
                        sx={{ mr: 1 }}
                    >
                        Configure Settlement Period
                    </Button>
                    <Button 
                        variant="outlined" 
                        onClick={handleFinalizeSplits}
                        sx={{ mr: 1 }}
                        color="secondary"
                    >
                        Finalize Splits
                    </Button>
                    <Button variant="contained" onClick={() => setOpenAddExpense(true)}>
                        Add Expense
                    </Button>
                </Box>
            </Box>

            {/* Time Filter */}
            <Box mb={3}>
                <FormControl fullWidth>
                    <InputLabel>Time Period</InputLabel>
                    <Select value={timeFilter} onChange={handleTimeFilterChange}>
                        <MenuItem value="all">All Time</MenuItem>
                        <MenuItem value="day">Last 24 Hours</MenuItem>
                        <MenuItem value="week">Last Week</MenuItem>
                        <MenuItem value="month">Last Month</MenuItem>
                        <MenuItem value="year">Last Year</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Settlement Summary */}
            {settlementSummary && (
                <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Settlement Summary</Typography>
                    <Typography>
                        Period: {settlementSummary.Period}
                    </Typography>
                    <Typography>
                        Total Amount: ${settlementSummary.TotalAmount}
                    </Typography>
                </Paper>
            )}

            {/* Balances Section */}
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Balances</Typography>
                <List>
                    {balances.Members.map((member) => (
                        <ListItem key={member.UserID}>
                            <ListItemText
                                primary={member.Name}
                                secondary={
                                    <>
                                        Net Balance: ${Number(member.NetBalance).toFixed(2)}
                                        {Number(member.OwesAmount) > 0 && (
                                            <Typography color="error" component="span" sx={{ ml: 2 }}>
                                                Owes: ${Number(member.OwesAmount).toFixed(2)}
                                            </Typography>
                                        )}
                                        {Number(member.IsOwedAmount) > 0 && (
                                            <Typography color="success.main" component="span" sx={{ ml: 2 }}>
                                                Is Owed: ${Number(member.IsOwedAmount).toFixed(2)}
                                            </Typography>
                                        )}
                                    </>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>

            {/* Expenses List */}
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Recent Expenses</Typography>
                <List>
                    {expenses.map((expense) => (
                        <React.Fragment key={expense.ExpenseID}>
                            <ListItem>
                                <ListItemText
                                    primary={
                                        <Typography>
                                            {expense.Description} - 
                                            <span style={{ fontWeight: 'bold' }}> ${expense.Amount.toFixed(2)}</span>
                                        </Typography>
                                    }
                                    secondary={
                                        <>
                                            <Typography component="span" color="text.primary">
                                                Paid by: {expense.PaidByUser.Name}
                                            </Typography>
                                            <br />
                                            Date: {new Date(expense.Date).toLocaleString()}
                                            <br />
                                            Status: {expense.IsSettled ? 'Settled' : 'Pending Settlement'}
                                        </>
                                    }
                                />
                            </ListItem>
                            <Divider />
                        </React.Fragment>
                    ))}
                </List>
            </Paper>

            {/* Add Expense Dialog */}
            <Dialog open={openAddExpense} onClose={() => setOpenAddExpense(false)}>
                <Box p={3} width={300}>
                    <Typography variant="h6" gutterBottom>Add New Expense</Typography>
                    <form onSubmit={handleAddExpense}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Amount"
                            type="number"
                            value={expenseForm.Amount}
                            onChange={(e) => setExpenseForm({ ...expenseForm, Amount: e.target.value })}
                            required
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Description"
                            value={expenseForm.Description}
                            onChange={(e) => setExpenseForm({ ...expenseForm, Description: e.target.value })}
                            required
                        />
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
                            Add Expense
                        </Button>
                    </form>
                </Box>
            </Dialog>

            {/* Settlement Config Dialog */}
            <Dialog open={showSettlementConfig} onClose={() => setShowSettlementConfig(false)}>
                <DialogTitle>Configure Settlement Period</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Settlement Period</InputLabel>
                        <Select
                            value={settlementPeriod}
                            onChange={(e) => handleSettlementPeriodChange(e.target.value)}
                        >
                            <MenuItem value="1h">Every Hour</MenuItem>
                            <MenuItem value="6h">Every 6 Hours</MenuItem>
                            <MenuItem value="12h">Every 12 Hours</MenuItem>
                            <MenuItem value="1d">Daily</MenuItem>
                            <MenuItem value="1w">Weekly</MenuItem>
                            <MenuItem value="1m">Monthly</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSettlementConfig(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Add Settlement Config Dialog */}
            <SettlementConfig
                open={openSettleConfig}
                onClose={() => setOpenSettleConfig(false)}
                onSave={handleSettlementPeriodSave}
            />

            {/* Finalize Splits Dialog */}
            <Dialog 
                open={showFinalizeDialog} 
                onClose={() => setShowFinalizeDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Finalized Settlements</DialogTitle>
                <DialogContent>
                    {finalizedSettlements && finalizedSettlements.length > 0 ? (
                        <List>
                            {finalizedSettlements.map((settlement, index) => (
                                <ListItem key={index}>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography>
                                                    Payment Required: ${Number(settlement.Amount).toFixed(2)}
                                                </Typography>
                                                <Button 
                                                    variant="contained" 
                                                    color="primary"
                                                    onClick={() => handlePayNow(settlement)}
                                                    size="small"
                                                >
                                                    Pay Now
                                                </Button>
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                From: {settlement.PayerName}
                                                <br />
                                                To: {settlement.ReceiverName}
                                                <br />
                                                Due by: {new Date(settlement.DueDate).toLocaleDateString()}
                                            </>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography>No settlements to finalize</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowFinalizeDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Payment Portal */}
            <PaymentPortal
                open={showPaymentPortal}
                onClose={() => setShowPaymentPortal(false)}
                settlement={selectedSettlement}
                onPaymentComplete={handlePaymentComplete}
            />
        </Box>
    );
};

export default Group;