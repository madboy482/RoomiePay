import React, { useState } from 'react';

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

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold">Configure Settlement Period</h2>
                </div>
                
                <div className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Settlement Period
                        </label>
                        <div className="relative">
                            <select
                                className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                            >
                                <option value="1h">Every Hour</option>
                                <option value="1d">Daily</option>
                                <option value="1w">Weekly</option>
                                <option value="1m">Monthly</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                    </div>

                    {period === 'custom' && (
                        <div className="flex gap-4 mt-4">
                            <div className="w-24">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Value
                                </label>
                                <input
                                    type="number"
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    value={customValue}
                                    onChange={(e) => setCustomValue(e.target.value)}
                                />
                            </div>
                            <div className="w-32">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unit
                                </label>
                                <div className="relative">
                                    <select
                                        className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={timeUnit}
                                        onChange={(e) => setTimeUnit(e.target.value)}
                                    >
                                        <option value="h">Hours</option>
                                        <option value="d">Days</option>
                                        <option value="w">Weeks</option>
                                        <option value="m">Months</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button 
                        className="px-4 py-2 text-gray-700 font-medium rounded-md hover:bg-gray-100 focus:outline-none"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none"
                        onClick={handleSave}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettlementConfig;