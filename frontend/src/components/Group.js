import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
        SplitType: 'EQUAL'
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
            
            console.log('Loaded expenses:', expensesRes.data);
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
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const expenseData = {
            GroupID: parseInt(groupId),
            Amount: parseFloat(expenseForm.Amount),
            Description: expenseForm.Description,
            PaidByUserID: currentUser.UserID,  // Always use the current user's ID
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
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Group Expenses</h1>
                <div className="flex space-x-2">
                    <button 
                        className="border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50"
                        onClick={() => setShowSettlementConfig(true)}
                    >
                        Configure Settlement Period
                    </button>
                    <button 
                        className="border border-purple-600 text-purple-600 px-4 py-2 rounded hover:bg-purple-50"
                        onClick={handleFinalizeSplits}
                    >
                        Finalize Splits
                    </button>
                    <button 
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        onClick={() => setOpenAddExpense(true)}
                    >
                        Add Expense
                    </button>
                </div>
            </div>

            {/* Time Filter */}
            <div className="mb-6">
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time Period
                    </label>
                    <select 
                        className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={timeFilter} 
                        onChange={handleTimeFilterChange}
                    >
                        <option value="all">All Time</option>
                        <option value="day">Last 24 Hours</option>
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                        <option value="year">Last Year</option>
                    </select>
                </div>
            </div>

            {/* Settlement Summary */}
            {settlementSummary && (
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <h2 className="text-lg font-semibold mb-2">Settlement Summary</h2>
                    <p className="text-gray-700">
                        Period: {settlementSummary.Period}
                    </p>
                    <p className="text-gray-700">
                        Total Amount: ${settlementSummary.TotalAmount}
                    </p>
                </div>
            )}

            {/* Balances Section */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h2 className="text-lg font-semibold mb-2">Balances</h2>
                <ul className="divide-y divide-gray-200">
                    {balances.Members.map((member) => (
                        <li key={member.UserID} className="py-3">
                            <div>
                                <p className="font-medium">{member.Name}</p>
                                <div className="text-sm text-gray-700">
                                    Net Balance: ${Number(member.NetBalance).toFixed(2)}
                                    {Number(member.OwesAmount) > 0 && (
                                        <span className="ml-2 text-red-600">
                                            Owes: ${Number(member.OwesAmount).toFixed(2)}
                                        </span>
                                    )}
                                    {Number(member.IsOwedAmount) > 0 && (
                                        <span className="ml-2 text-green-600">
                                            Is Owed: ${Number(member.IsOwedAmount).toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h2 className="text-lg font-semibold mb-2">Recent Expenses</h2>
                <ul className="divide-y divide-gray-200">
                    {expenses.map((expense) => (
                        <li key={expense.ExpenseID} className="py-3">
                            <div>
                                <p>
                                    {expense.Description} - 
                                    <span className="font-bold"> ${expense.Amount.toFixed(2)}</span>
                                </p>
                                <div className="text-sm text-gray-700 mt-1">
                                    <p className="text-gray-900">
                                        Paid by: {expense.PaidByUser.Name}
                                    </p>
                                    <p>
                                        Date: {new Date(expense.Date).toLocaleString()}
                                    </p>
                                    <p>
                                        Status: {expense.IsSettled ? 'Settled' : 'Pending Settlement'}
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Add Expense Dialog */}
            {openAddExpense && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Add New Expense</h2>
                        <form onSubmit={handleAddExpense}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="amount">
                                    Amount
                                </label>
                                <input
                                    id="amount"
                                    type="number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={expenseForm.Amount}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, Amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="description">
                                    Description
                                </label>
                                <input
                                    id="description"
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={expenseForm.Description}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, Description: e.target.value })}
                                    required
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md mt-4"
                            >
                                Add Expense
                            </button>
                            <button
                                type="button"
                                className="w-full text-gray-500 hover:text-gray-700 mt-2"
                                onClick={() => setOpenAddExpense(false)}
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Settlement Config Dialog */}
            {showSettlementConfig && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Configure Settlement Period</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-1">
                                Settlement Period
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={settlementPeriod}
                                onChange={(e) => handleSettlementPeriodChange(e.target.value)}
                            >
                                <option value="1h">Every Hour</option>
                                <option value="6h">Every 6 Hours</option>
                                <option value="12h">Every 12 Hours</option>
                                <option value="1d">Daily</option>
                                <option value="1w">Weekly</option>
                                <option value="1m">Monthly</option>
                            </select>
                        </div>
                        <div className="flex justify-end">
                            <button 
                                className="text-blue-600 hover:text-blue-800 font-medium"
                                onClick={() => setShowSettlementConfig(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Settlement Config Component */}
            <SettlementConfig
                open={openSettleConfig}
                onClose={() => setOpenSettleConfig(false)}
                onSave={handleSettlementPeriodSave}
            />

            {/* Finalize Splits Dialog */}
            {showFinalizeDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
                        <h2 className="text-xl font-semibold mb-4">Finalized Settlements</h2>
                        
                        {finalizedSettlements && finalizedSettlements.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {finalizedSettlements.map((settlement, index) => (
                                    <li key={index} className="py-3">
                                        <div className="flex justify-between items-center">
                                            <p className="font-medium">
                                                Payment Required: ${Number(settlement.Amount).toFixed(2)}
                                            </p>
                                            <button 
                                                className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700"
                                                onClick={() => handlePayNow(settlement)}
                                            >
                                                Pay Now
                                            </button>
                                        </div>
                                        <div className="text-sm text-gray-700 mt-1">
                                            <p>From: {settlement.PayerName}</p>
                                            <p>To: {settlement.ReceiverName}</p>
                                            <p>Due by: {new Date(settlement.DueDate).toLocaleDateString()}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No settlements to finalize</p>
                        )}
                        
                        <div className="flex justify-end mt-4">
                            <button 
                                className="text-blue-600 hover:text-blue-800 font-medium"
                                onClick={() => setShowFinalizeDialog(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Portal Component */}
            <PaymentPortal
                open={showPaymentPortal}
                onClose={() => setShowPaymentPortal(false)}
                settlement={selectedSettlement}
                onPaymentComplete={handlePaymentComplete}
            />
        </div>
    );
};

export default Group;