import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Button, Typography, Paper, Dialog, TextField,
    List, ListItem, ListItemText, Divider, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
    getGroupExpenses,
    getGroupBalances,
    addExpense,
    getSettlementSummary
} from '../services/api';

const Group = () => {
    const { groupId } = useParams();
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState({ Members: [] });
    const [openAddExpense, setOpenAddExpense] = useState(false);
    const [timeFilter, setTimeFilter] = useState('all');
    const [settlementSummary, setSettlementSummary] = useState(null);
    const [expenseForm, setExpenseForm] = useState({
        Amount: '',
        Description: '',
        SplitType: 'EQUAL',
        PaidByUserID: JSON.parse(localStorage.getItem('user'))?.UserID
    });

    useEffect(() => {
        loadGroupData();
    }, [groupId, timeFilter]);

    const loadGroupData = async () => {
        try {
            let expensesUrl = `/groups/${groupId}/expenses`;
            let summaryUrl = `/groups/${groupId}/settlements/summary`;
            
            if (timeFilter !== 'all') {
                expensesUrl += `?period=${timeFilter}`;
                summaryUrl += `?period=${timeFilter}`;
            }

            const [expensesRes, balancesRes, summaryRes] = await Promise.all([
                getGroupExpenses(expensesUrl),
                getGroupBalances(groupId),
                getSettlementSummary(summaryUrl)
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

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Group Expenses</Typography>
                <Button variant="contained" onClick={() => setOpenAddExpense(true)}>
                    Add Expense
                </Button>
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
                                        Net Balance: ${member.NetBalance.toFixed(2)}
                                        {member.OwesAmount > 0 && (
                                            <Typography color="error" component="span" sx={{ ml: 2 }}>
                                                Owes: ${member.OwesAmount.toFixed(2)}
                                            </Typography>
                                        )}
                                        {member.IsOwedAmount > 0 && (
                                            <Typography color="success.main" component="span" sx={{ ml: 2 }}>
                                                Is Owed: ${member.IsOwedAmount.toFixed(2)}
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
            <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Recent Expenses</Typography>
                <List>
                    {expenses.map((expense) => (
                        <React.Fragment key={expense.ExpenseID}>
                            <ListItem>
                                <ListItemText
                                    primary={expense.Description}
                                    secondary={
                                        <>
                                            Amount: ${expense.Amount.toFixed(2)} • 
                                            Paid by: {expense.PaidByUser.Name} •
                                            Date: {new Date(expense.Date).toLocaleString()}
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
        </Box>
    );
};

export default Group;