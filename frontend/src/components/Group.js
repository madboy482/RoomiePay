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
        console.log('Current user from localStorage:', currentUser);
        
        const expenseData = {
            GroupID: parseInt(groupId),
            Amount: parseFloat(expenseForm.Amount),
            Description: expenseForm.Description,
            PaidByUserID: currentUser.UserID,
            SplitType: 'EQUAL',
            Splits: null
        };
        console.log('Sending expense data:', expenseData);
        try {
            const response = await addExpense(expenseData);
            console.log('Add expense response:', response.data);
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
                                <p className="font-medium text-lg mb-1">{member.Name}</p>
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-600">
                                        Net Balance: <span className={member.NetBalance > 0 ? "text-green-600" : member.NetBalance < 0 ? "text-red-600" : "text-gray-600"}>
                                            ${Number(member.NetBalance).toFixed(2)}
                                        </span>
                                    </p>
                                    {Number(member.OwesAmount) > 0 && (
                                        <div className="text-sm">
                                            <p className="text-red-600 font-medium">
                                                Needs to pay: ${Number(member.OwesAmount).toFixed(2)}
                                            </p>
                                            <p className="text-gray-500 text-xs mt-1">
                                                Your share of the total expenses
                                            </p>
                                        </div>
                                    )}
                                    {Number(member.IsOwedAmount) > 0 && (
                                        <div className="text-sm">
                                            <p className="text-green-600 font-medium">
                                                Will receive: ${Number(member.IsOwedAmount).toFixed(2)}
                                            </p>
                                            <p className="text-gray-500 text-xs mt-1">
                                                Total amount you paid for the group
                                            </p>
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-2">
                                        Each person's equal share: ${(Number(settlementSummary?.TotalAmount || 0) / balances.Members.length).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">Total Group Expenses:</span> ${settlementSummary?.TotalAmount || '0.00'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Split equally among {balances.Members.length} members
                    </p>
                </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h2 className="text-lg font-semibold mb-4">Expense Transactions</h2>
                
                {/* Spending Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-md font-semibold mb-3">Spending Summary</h3>
                    {Object.entries(expenses.reduce((acc, expense) => {
                        // Group by description (category)
                        const category = expense.Description.toLowerCase();
                        if (!acc[category]) {
                            acc[category] = {
                                total: 0,
                                count: 0,
                                transactions: []
                            };
                        }
                        acc[category].total += Number(expense.Amount);
                        acc[category].count += 1;
                        acc[category].transactions.push(expense);
                        return acc;
                    }, {})).map(([category, data]) => (
                        <div key={category} className="mb-3 pb-3 border-b border-gray-200 last:border-0">
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-medium capitalize">{category}</p>
                                <p className="text-sm text-gray-600">
                                    {data.count} transaction{data.count !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <p className="text-lg font-bold text-blue-600">
                                ${Number(data.total).toFixed(2)}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Per Person Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-md font-semibold mb-3">Per Person Spending</h3>
                    {Object.entries(expenses.reduce((acc, expense) => {
                        const payer = expense.PaidByUser.Name;
                        if (!acc[payer]) {
                            acc[payer] = {
                                total: 0,
                                transactions: []
                            };
                        }
                        acc[payer].total += Number(expense.Amount);
                        acc[payer].transactions.push(expense);
                        return acc;
                    }, {})).map(([payer, data]) => (
                        <div key={payer} className="mb-3 pb-3 border-b border-gray-200 last:border-0">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{payer}</p>
                                    <p className="text-sm text-gray-600">
                                        {data.transactions.length} transaction{data.transactions.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <p className="text-lg font-bold text-green-600">
                                    ${Number(data.total).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Detailed Transaction List */}
                <div>
                    <h3 className="text-md font-semibold mb-3">All Transactions</h3>
                    <ul className="divide-y divide-gray-200">
                        {expenses.sort((a, b) => new Date(b.Date) - new Date(a.Date)).map((expense) => (
                            <li key={expense.ExpenseID} className="py-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-lg">
                                            {expense.Description}
                                        </p>
                                        <div className="text-sm text-gray-600 space-y-1 mt-1">
                                            <p>
                                                Paid by: <span className="font-medium">{expense.PaidByUser.Name}</span>
                                            </p>
                                            <p>
                                                Date: {new Date(expense.Date).toLocaleString()}
                                            </p>
                                            <p>
                                                Status: <span className={expense.IsSettled ? "text-green-600" : "text-yellow-600"}>
                                                    {expense.IsSettled ? 'Settled' : 'Pending Settlement'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-900">
                                            ${Number(expense.Amount).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
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
                        <h2 className="text-xl font-semibold mb-4">Finalize Group Settlements</h2>

                        {/* Total Group Summary */}
                        <div className="bg-blue-50 p-4 rounded-lg mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold text-blue-800">Total Group Summary</h3>
                                <p className="text-2xl font-bold text-blue-800">
                                    ${Number(settlementSummary?.TotalAmount || 0).toFixed(2)}
                                </p>
                            </div>
                            <p className="text-sm text-blue-600">
                                Split equally among {balances.Members.length} members
                                (${(Number(settlementSummary?.TotalAmount || 0) / balances.Members.length).toFixed(2)} per person)
                            </p>
                        </div>

                        {/* Member Balances */}
                        <div className="mb-6">
                            <h3 className="text-md font-semibold mb-3">Current Member Balances</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {balances.Members.map(member => (
                                    <div key={member.UserID} className={`p-4 rounded-lg border ${
                                        member.NetBalance > 0 ? 'bg-green-50 border-green-200' : 
                                        member.NetBalance < 0 ? 'bg-red-50 border-red-200' : 
                                        'bg-gray-50 border-gray-200'
                                    }`}>
                                        <p className="font-medium text-lg mb-1">{member.Name}</p>
                                        <div className="space-y-1">
                                            <p className={`text-sm ${
                                                member.NetBalance > 0 ? 'text-green-600' : 
                                                member.NetBalance < 0 ? 'text-red-600' : 
                                                'text-gray-600'
                                            }`}>
                                                Net Balance: ${Number(member.NetBalance).toFixed(2)}
                                            </p>
                                            {Number(member.OwesAmount) > 0 && (
                                                <p className="text-red-600 text-sm">
                                                    Needs to pay: ${Number(member.OwesAmount).toFixed(2)}
                                                </p>
                                            )}
                                            {Number(member.IsOwedAmount) > 0 && (
                                                <p className="text-green-600 text-sm">
                                                    Will receive: ${Number(member.IsOwedAmount).toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Settlement Actions */}
                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-md font-semibold mb-3">Required Payments</h3>
                            {finalizedSettlements && finalizedSettlements.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {finalizedSettlements.map((settlement, index) => (
                                        <li key={index} className="py-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">
                                                        {settlement.PayerName} → {settlement.ReceiverName}
                                                    </p>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        <p>Amount: ${Number(settlement.Amount).toFixed(2)}</p>
                                                        <p>Due by: {new Date(settlement.DueDate).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    className="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700"
                                                    onClick={() => handlePayNow(settlement)}
                                                >
                                                    Pay Now
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No settlements to finalize</p>
                            )}
                        </div>
                        
                        <div className="flex justify-end mt-6">
                            <button 
                                className="text-gray-600 hover:text-gray-800 font-medium px-4 py-2"
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