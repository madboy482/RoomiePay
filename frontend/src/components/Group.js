import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();
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
                getSettlementSummary(groupId, timeFilter !== 'all' ? timeFilter : null)
            ]);
            
            setExpenses(expensesRes.data);
            setBalances(balancesRes.data);
            setSettlementSummary(summaryRes.data);

            // Calculate total expenses
            const totalExpenses = expensesRes.data.reduce((sum, expense) => sum + Number(expense.Amount), 0);
            setSettlementSummary(prev => ({
                ...prev,
                TotalAmount: totalExpenses
            }));
        } catch (error) {
            console.error('Failed to load group data:', error);
        }
    };

    const handleTimeFilterChange = (event) => {
        setTimeFilter(event.target.value);
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            
            if (!token || !userStr) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }

            const currentUser = JSON.parse(userStr);
            const expenseData = {
                GroupID: parseInt(groupId),
                Amount: parseFloat(expenseForm.Amount),
                Description: expenseForm.Description,
                PaidByUserID: currentUser.UserID  // Explicitly set the paying user
            };
            
            console.log('Adding expense as user:', currentUser.Name, '(ID:', currentUser.UserID, ')');
            const response = await addExpense(expenseData);
            console.log('Expense added:', response.data);
            
            setOpenAddExpense(false);
            setExpenseForm({
                Amount: '',
                Description: '',
                SplitType: 'EQUAL'
            });
            
            await loadGroupData();
        } catch (error) {
            console.error('Failed to add expense:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else if (error.response?.status === 403) {
                alert('You are not a member of this group');
            } else {
                alert(error.response?.data?.detail || 'Failed to add expense');
            }
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
            {/* Header with Members List */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Group Overview</h1>
                    <div className="flex space-x-3">
                        <button 
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            onClick={handleFinalizeSplits}
                        >
                            Settle Now
                        </button>
                        <button 
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            onClick={() => setOpenAddExpense(true)}
                        >
                            Add Expense
                        </button>
                    </div>
                </div>

                {/* Members List */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <h2 className="text-lg font-semibold mb-3">Group Members</h2>
                    <div className="flex flex-wrap gap-2">
                        {balances.Members.map((member) => (
                            <div 
                                key={member.UserID}
                                className="bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-700"
                            >
                                {member.Name}
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="flex items-center space-x-4">
                    <div className="flex-1">
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
                    <div className="flex space-x-2">
                        <button 
                            className="text-gray-600 hover:text-gray-800 font-medium"
                            onClick={() => setShowSettlementConfig(true)}
                        >
                            Settlement Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Total Expenses Card */}
                <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Total Expenses</h3>
                    <p className="text-2xl font-bold text-gray-900">
                        ${Number(settlementSummary?.TotalAmount || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        {expenses.length} transactions
                    </p>
                </div>

                {/* Per Person Share Card */}
                <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Per Person Share</h3>
                    <p className="text-2xl font-bold text-gray-900">
                        ${(Number(settlementSummary?.TotalAmount || 0) / (balances.Members.length || 1)).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        Split among {balances.Members.length} members
                    </p>
                </div>

                {/* Settlement Period Card */}
                <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Settlement Period</h3>
                    <p className="text-lg font-medium text-gray-900">
                        {settlementPeriod === '1h' ? 'Hourly' :
                         settlementPeriod === '1d' ? 'Daily' :
                         settlementPeriod === '1w' ? 'Weekly' :
                         settlementPeriod === '1m' ? 'Monthly' :
                         'Custom'}
                    </p>
                    <button 
                        onClick={() => setShowSettlementConfig(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                    >
                        Configure
                    </button>
                </div>
            </div>

            {/* Member Balances */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h2 className="text-lg font-semibold mb-4">Member Balances</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {balances.Members.map((member) => (
                        <div 
                            key={member.UserID} 
                            className={`p-4 rounded-lg border ${
                                member.NetBalance > 0 ? 'bg-green-50 border-green-200' : 
                                member.NetBalance < 0 ? 'bg-red-50 border-red-200' : 
                                'bg-gray-50 border-gray-200'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium text-lg">{member.Name}</h3>
                                    <p className={`text-sm mt-1 ${
                                        member.NetBalance > 0 ? 'text-green-600' : 
                                        member.NetBalance < 0 ? 'text-red-600' : 
                                        'text-gray-600'
                                    }`}>
                                        Net Balance: ${Number(member.NetBalance).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-2 space-y-1 text-sm">
                                {Number(member.OwesAmount) > 0 && (
                                    <p className="text-red-600">
                                        Owes: ${Number(member.OwesAmount).toFixed(2)}
                                    </p>
                                )}
                                {Number(member.IsOwedAmount) > 0 && (
                                    <p className="text-green-600">
                                        Is Owed: ${Number(member.IsOwedAmount).toFixed(2)}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Transaction History</h2>
                    <button 
                        className="text-blue-600 hover:text-blue-800 font-medium"
                        onClick={handleFinalizeSplits}
                    >
                        View Settlement Status
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Per Person Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(expenses.reduce((acc, expense) => {
                            const payer = expense.PaidByUser.Name;
                            if (!acc[payer]) {
                                acc[payer] = {
                                    total: 0,
                                    count: 0
                                };
                            }
                            acc[payer].total += Number(expense.Amount);
                            acc[payer].count += 1;
                            return acc;
                        }, {})).map(([payer, data]) => (
                            <div key={payer} className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-medium mb-2">{payer}</h3>
                                <p className="text-lg font-bold text-blue-600">
                                    ${Number(data.total).toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {data.count} transaction{data.count !== 1 ? 's' : ''}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Transactions List */}
                    <div>
                        <h3 className="text-md font-medium mb-3">Recent Transactions</h3>
                        <div className="overflow-hidden">
                            <ul className="divide-y divide-gray-200">
                                {expenses.sort((a, b) => new Date(b.Date) - new Date(a.Date)).map((expense) => (
                                    <li key={expense.ExpenseID} className="py-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{expense.Description}</p>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    <p>Paid by {expense.PaidByUser.Name}</p>
                                                    <p>{new Date(expense.Date).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg">
                                                    ${Number(expense.Amount).toFixed(2)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {expense.IsSettled ? 'Settled' : 'Pending'}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
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
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Settlement Status</h2>
                            <button 
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => setShowFinalizeDialog(false)}
                            >
                                <span className="sr-only">Close</span>
                                ×
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Settlement Summary */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="font-medium mb-2">Total Settlements</h3>
                                <p className="text-2xl font-bold text-blue-800">
                                    ${Number(settlementSummary?.TotalAmount || 0).toFixed(2)}
                                </p>
                                <p className="text-sm text-blue-600 mt-1">
                                    Split among {balances.Members.length} members
                                </p>
                            </div>

                            {/* Settlement List */}
                            {finalizedSettlements && finalizedSettlements.length > 0 ? (
                                <div className="space-y-4">
                                    {finalizedSettlements.map((settlement, index) => (
                                        <div key={index} className="bg-white border rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">
                                                        {settlement.PayerName} → {settlement.ReceiverName}
                                                    </p>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        <p>Amount: ${Number(settlement.Amount).toFixed(2)}</p>
                                                        <p>Due: {new Date(settlement.DueDate).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 text-sm rounded-full ${
                                                    settlement.Status === 'Pending' 
                                                        ? 'bg-yellow-100 text-yellow-800' 
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {settlement.Status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500">No settlements to display</p>
                            )}
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