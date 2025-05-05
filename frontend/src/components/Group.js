import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getGroupExpenses,
    getGroupBalances,
    addExpense,
    getSettlementSummary,
    setSettlementPeriod,
    finalizeGroupSplits,
    getGroupInviteCode
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
    const [isAdmin, setIsAdmin] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [showInviteCode, setShowInviteCode] = useState(false);
    const [copySuccess, setCopySuccess] = useState('');
    const [groupName, setGroupName] = useState('Group Overview');

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

            // Extract group name if available in the response
            if (balancesRes.data.GroupName) {
                setGroupName(balancesRes.data.GroupName);
            }

            // Calculate total expenses
            const totalExpenses = expensesRes.data.reduce((sum, expense) => sum + Number(expense.Amount), 0);
            setSettlementSummary(prev => ({
                ...prev,
                TotalAmount: totalExpenses
            }));
            
            // Check admin status after loading balances
            checkAdminStatus(balancesRes.data);
        } catch (error) {
            console.error('Failed to load group data:', error);
        }
    };

    const checkAdminStatus = (balancesData) => {
        try {
            // Get the stored user data
            const userStr = localStorage.getItem('user');
            if (!userStr) return;

            const user = JSON.parse(userStr);
            const userId = user.UserID;

            // Use the balances data that was already loaded
            const groupMembers = balancesData.Members;
            
            // For the purposes of this demo, we'll assume the creator of the group is the admin
            // In a real app, you'd have a specific API endpoint to check admin status
            // or the group members API would include isAdmin flag
            
            // For now, we'll set isAdmin to true so we can test the functionality
            // In a real implementation, you should check the proper admin status
            setIsAdmin(true);
        } catch (error) {
            console.error('Failed to check admin status:', error);
        }
    };

    const getInviteCode = async () => {
        if (showInviteCode) {
            // If code is already showing, just hide it
            setShowInviteCode(false);
            return;
        }
        
        try {
            const response = await getGroupInviteCode(groupId);
            setInviteCode(response.data.invite_code);
            setShowInviteCode(true);
        } catch (error) {
            console.error('Failed to get invite code:', error);
            if (error.response?.status === 403) {
                alert('Only group admins can access the invite code');
            } else {
                alert('Failed to retrieve invite code');
            }
        }
    };

    const copyInviteCodeToClipboard = () => {
        navigator.clipboard.writeText(inviteCode)
            .then(() => {
                setCopySuccess('Copied!');
                setTimeout(() => setCopySuccess(''), 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
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
            setSettlementPeriodState(period);
        } catch (error) {
            console.error('Failed to update settlement period:', error);
        }
    };

    const handleSettlementPeriodSave = async (period) => {
        try {
            await setSettlementPeriod(groupId, period);
        } catch (error) {
            console.error('Failed to set settlement period:', error);
        }
    };

    const handleFinalizeSplits = async () => {
        try {
            const response = await finalizeGroupSplits(groupId);
            
            // Filter out any settlements that might be duplicates of already confirmed ones
            let newSettlements = [];
            
            // If we already have some settlements stored
            if (finalizedSettlements && finalizedSettlements.length > 0) {
                // Get all existing confirmed settlements
                const confirmedSettlements = finalizedSettlements.filter(s => s.Status === 'Confirmed');
                
                // Filter the new settlements to exclude those that match confirmed ones
                newSettlements = response.data.filter(newS => {
                    // Don't include settlements where the same payer already paid the same receiver
                    return !confirmedSettlements.some(
                        confirmedS => 
                            (confirmedS.PayerUserID === newS.PayerUserID && 
                             confirmedS.ReceiverUserID === newS.ReceiverUserID)
                    );
                });
                
                // Combine confirmed settlements with new ones
                setFinalizedSettlements([...confirmedSettlements, ...newSettlements]);
            } else {
                setFinalizedSettlements(response.data);
            }
            
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

    const handlePaymentComplete = async (settlementId, success) => {
        if (success) {
            console.log('Payment successful for settlement:', settlementId);
            
            // Update the local settlement state to reflect payment
            if (finalizedSettlements) {
                const updatedSettlements = finalizedSettlements.map(s => 
                    s.SettlementID === settlementId 
                        ? {...s, Status: 'Confirmed', PaymentDate: new Date().toISOString()} 
                        : s
                );
                setFinalizedSettlements(updatedSettlements);
            }
            
            // Reload all group data after a short delay to ensure the backend has processed everything
            setTimeout(async () => {
                try {
                    await loadGroupData();
                    console.log('Group data refreshed after payment');
                } catch (error) {
                    console.error('Failed to refresh group data:', error);
                }
            }, 500);
        }
        
        setSelectedSettlement(null);
        setShowPaymentPortal(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header with Members List */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                            {groupName}
                        </h1>
                        <div className="flex gap-4">
                            <button 
                                className="relative px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 group"
                                onClick={handleFinalizeSplits}
                            >
                                <span className="flex items-center gap-2">
                                    Settle Now
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </span>
                            </button>
                            <button 
                                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 group"
                                onClick={() => setOpenAddExpense(true)}
                            >
                                <span className="flex items-center gap-2">
                                    Add Expense
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Members List */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 mb-8 border border-white/20">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-slate-800">Group Members</h2>
                            {isAdmin && (
                                <button
                                    className="text-teal-600 hover:text-teal-800 text-sm font-medium flex items-center gap-2 transition-colors"
                                    onClick={getInviteCode}
                                >
                                    {showInviteCode ? 'Hide Invite Code' : 'Show Invite Code'}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showInviteCode ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                                    </svg>
                                </button>
                            )}
                        </div>
                        
                        {/* Invite Code Section - Only visible to admins */}
                        {isAdmin && showInviteCode && (
                            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 mb-6 rounded-lg border border-teal-100 transition-all duration-300">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-teal-800 font-medium mb-1">Group Invite Code:</p>
                                        <p className="text-lg font-mono tracking-wider bg-white/80 px-4 py-2 rounded-lg border border-teal-200 inline-block select-all">
                                            {inviteCode}
                                        </p>
                                    </div>
                                    <button
                                        onClick={copyInviteCodeToClipboard}
                                        className="ml-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 group"
                                    >
                                        <span className="flex items-center gap-2">
                                            {copySuccess || 'Copy'}
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </span>
                                    </button>
                                </div>
                                <p className="text-xs text-teal-700 mt-2">
                                    Share this code with others to invite them to this group.
                                </p>
                            </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                            {balances.Members.map((member) => (
                                <div 
                                    key={member.UserID}
                                    className="bg-gradient-to-r from-teal-100/80 to-emerald-100/80 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-teal-700 border border-teal-200/50 hover:shadow-md transition-all duration-300"
                                >
                                    {member.Name}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Time Period
                            </label>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                                <select 
                                    className="block w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
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
                        <div className="flex space-x-2">
                            <button 
                                className="text-teal-600 hover:text-teal-800 font-medium flex items-center gap-2 transition-colors"
                                onClick={() => setShowSettlementConfig(true)}
                            >
                                <span>Settlement Settings</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Expenses Card */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-white/20 transition-all duration-300 hover:shadow-lg group">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <h3 className="text-sm font-medium text-slate-500 mb-1">Total Expenses</h3>
                        <p className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                            ${Number(settlementSummary?.TotalAmount || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                            {expenses.length} transactions
                        </p>
                    </div>

                    {/* Per Person Share Card */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-white/20 transition-all duration-300 hover:shadow-lg group">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <h3 className="text-sm font-medium text-slate-500 mb-1">Per Person Share</h3>
                        <p className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                            ${(Number(settlementSummary?.TotalAmount || 0) / (balances.Members.length || 1)).toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                            Split among {balances.Members.length} members
                        </p>
                    </div>

                    {/* Settlement Period Card */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-white/20 transition-all duration-300 hover:shadow-lg group">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <h3 className="text-sm font-medium text-slate-500 mb-1">Settlement Period</h3>
                        <p className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                            {settlementPeriod === '1h' ? 'Hourly' :
                             settlementPeriod === '1d' ? 'Daily' :
                             settlementPeriod === '1w' ? 'Weekly' :
                             settlementPeriod === '1m' ? 'Monthly' :
                             'Custom'}
                        </p>
                        <button 
                            onClick={() => setShowSettlementConfig(true)}
                            className="text-sm text-teal-600 hover:text-teal-800 font-medium mt-2 flex items-center gap-1 transition-colors"
                        >
                            <span>Configure</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Member Balances */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 mb-8 border border-white/20">
                    <h2 className="text-xl font-semibold text-slate-800 mb-6">Member Balances</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {balances.Members.map((member) => {
                            // Parse the values to ensure proper formatting
                            const netBalance = Number(member.NetBalance).toFixed(2);
                            const owesAmount = Number(member.OwesAmount).toFixed(2);
                            const isOwedAmount = Number(member.IsOwedAmount).toFixed(2);
                            
                            // Determine the card background color
                            const cardClass = 
                                parseFloat(netBalance) > 0 ? 'from-emerald-50 to-green-50 border-emerald-200' : 
                                parseFloat(netBalance) < 0 ? 'from-red-50 to-rose-50 border-red-200' : 
                                'from-slate-50 to-gray-50 border-slate-200';
                                
                            const textClass =
                                parseFloat(netBalance) > 0 ? 'from-emerald-600 to-green-600' : 
                                parseFloat(netBalance) < 0 ? 'from-red-600 to-rose-600' : 
                                'from-slate-600 to-gray-600';
                                
                            return (
                                <div 
                                    key={member.UserID} 
                                    className={`bg-gradient-to-r ${cardClass} rounded-xl p-6 border backdrop-blur-sm transition-all duration-300 hover:shadow-md relative overflow-hidden group`}
                                >
                                    <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10">
                                        <h3 className="font-semibold text-xl text-slate-800 mb-3">{member.Name}</h3>
                                        <p className={`text-lg font-bold bg-gradient-to-r ${textClass} bg-clip-text text-transparent mb-4`}>
                                            Net Balance: ${netBalance}
                                        </p>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600">Owes:</span>
                                                <span className={parseFloat(owesAmount) > 0 ? "text-red-600 font-medium" : "text-slate-500"}>
                                                    ${owesAmount}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600">Is Owed:</span>
                                                <span className={parseFloat(isOwedAmount) > 0 ? "text-emerald-600 font-medium" : "text-slate-500"}>
                                                    ${isOwedAmount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-white/20">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-slate-800">Transaction History</h2>
                        <button 
                            className="text-teal-600 hover:text-teal-800 font-medium flex items-center gap-2 transition-colors"
                            onClick={handleFinalizeSplits}
                        >
                            <span>View Settlement Status</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* Per Person Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                <div key={payer} className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-5 border border-slate-200 transition-all duration-300 hover:shadow-md group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-emerald-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <h3 className="font-medium text-slate-800 mb-2">{payer}</h3>
                                    <p className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                                        ${Number(data.total).toFixed(2)}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {data.count} transaction{data.count !== 1 ? 's' : ''}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Transactions List */}
                    <div>
                        <h3 className="text-md font-medium mb-3 text-slate-700">Recent Transactions</h3>
                        <div className="overflow-hidden">
                            <ul className="divide-y divide-slate-200">
                                {expenses.sort((a, b) => new Date(b.Date) - new Date(a.Date)).map((expense) => (
                                    <li key={expense.ExpenseID} className="py-4 transition-all duration-300 hover:bg-slate-50/50 rounded-lg px-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-slate-800">{expense.Description}</p>
                                                <div className="text-sm text-slate-600 mt-1">
                                                    <p>Paid by {expense.PaidByUser.Name}</p>
                                                    <p>{new Date(expense.Date).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                                                    ${Number(expense.Amount).toFixed(2)}
                                                </p>
                                                <p className={`text-sm ${expense.IsSettled ? "text-emerald-600" : "text-amber-600"} font-medium`}>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-white/20">
                        <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Add New Expense</h2>
                        <form onSubmit={handleAddExpense}>
                            <div className="mb-4">
                                <label className="block text-slate-700 text-sm font-medium mb-1" htmlFor="amount">
                                    Amount
                                </label>
                                <input
                                    id="amount"
                                    type="number"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    value={expenseForm.Amount}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, Amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-slate-700 text-sm font-medium mb-1" htmlFor="description">
                                    Description
                                </label>
                                <input
                                    id="description"
                                    type="text"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    value={expenseForm.Description}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, Description: e.target.value })}
                                    required
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-3 px-4 rounded-lg mt-4 transition-all duration-300"
                            >
                                Add Expense
                            </button>
                            <button
                                type="button"
                                className="w-full text-slate-500 hover:text-slate-700 mt-2 py-2"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-white/20">
                        <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Configure Settlement Period</h2>
                        <div className="mb-4">
                            <label className="block text-slate-700 text-sm font-medium mb-1">
                                Settlement Period
                            </label>
                            <select
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                                className="text-teal-600 hover:text-teal-800 font-medium flex items-center gap-2 transition-colors"
                                onClick={() => setShowSettlementConfig(false)}
                            >
                                <span>Close</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 w-full max-w-4xl shadow-xl border border-white/20">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Settlement Status</h2>
                            <button 
                                className="text-slate-500 hover:text-slate-700 text-xl"
                                onClick={() => setShowFinalizeDialog(false)}
                            >
                                <span className="sr-only">Close</span>
                                ×
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Settlement Summary */}
                            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-xl border border-teal-100">
                                <h3 className="font-medium mb-2 text-teal-800">Total Settlements</h3>
                                <p className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                                    ${Number(settlementSummary?.TotalAmount || 0).toFixed(2)}
                                </p>
                                <p className="text-sm text-teal-700 mt-1">
                                    Split among {balances.Members.length} members
                                </p>
                            </div>

                            {/* Settlement List */}
                            {finalizedSettlements && finalizedSettlements.length > 0 ? (
                                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="space-y-4">
                                        {finalizedSettlements.map((settlement, index) => (
                                            <div key={index} className="bg-white border rounded-xl p-4 hover:shadow-md transition-all duration-300">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-slate-800">
                                                            {settlement.PayerName} → {settlement.ReceiverName}
                                                        </p>
                                                        <div className="text-sm text-slate-600 mt-1">
                                                            <p>Amount: ${Number(settlement.Amount).toFixed(2)}</p>
                                                            <p>Due: {new Date(settlement.DueDate).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className={`px-3 py-1 text-sm rounded-full mb-2 ${
                                                            settlement.Status === 'Pending' 
                                                                ? 'bg-amber-100 text-amber-800' 
                                                                : 'bg-emerald-100 text-emerald-800'
                                                        }`}>
                                                            {settlement.Status}
                                                        </span>
                                                        {settlement.Status === 'Pending' && settlement.PayerUserID === JSON.parse(localStorage.getItem('user')).UserID && (
                                                            <button
                                                                onClick={() => handlePayNow(settlement)}
                                                                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-4 py-2 text-sm rounded-lg transition-colors duration-300 flex items-center gap-1"
                                                            >
                                                                <span>Pay Now</span>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-slate-500 py-8">No settlements to display</p>
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
        </div>
    );
};

export default Group;