import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Button, Typography, Paper, Dialog, TextField,
    List, ListItem, ListItemText, Divider
} from '@mui/material';
import {
    getGroupExpenses,
    getGroupBalances,
    addExpense
} from '../services/api';

const Group = () => {
    const { groupId } = useParams();
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState({ Members: [] });
    const [openAddExpense, setOpenAddExpense] = useState(false);
    const [expenseForm, setExpenseForm] = useState({
        Amount: '',
        Description: '',
        SplitType: 'EQUAL',
        PaidByUserID: JSON.parse(localStorage.getItem('user'))?.UserID
    });

    useEffect(() => {
        loadGroupData();
    }, [groupId]);

    const loadGroupData = async () => {
        try {
            const [expensesRes, balancesRes] = await Promise.all([
                getGroupExpenses(groupId),
                getGroupBalances(groupId)
            ]);
            setExpenses(expensesRes.data);
            setBalances(balancesRes.data);
        } catch (error) {
            console.error('Failed to load group data:', error);
        }
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

            {/* Balances Section */}
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Balances</Typography>
                <List>
                    {balances.Members.map((member) => (
                        <ListItem key={member.UserID}>
                            <ListItemText
                                primary={member.Name}
                                secondary={`Net Balance: ${member.NetBalance}`}
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
                                    secondary={`Amount: $${expense.Amount} • Paid by: ${expense.PaidByUserID}`}
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