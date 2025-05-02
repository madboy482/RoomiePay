import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Alert } from 'react-bootstrap';
import { getSettlementHistory, processPayment, getGroupSettlements } from '../services/api';

const Settlements = ({ groupId }) => {
    const [settlements, setSettlements] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedSettlement, setSelectedSettlement] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [showFinalizedModal, setShowFinalizedModal] = useState(false);
    const [finalizedSettlements, setFinalizedSettlements] = useState([]);

    useEffect(() => {
        loadSettlements();
    }, [groupId]);

    const loadSettlements = async () => {
        try {
            setLoading(true);
            const response = await getSettlementHistory();
            setSettlements(response.data);
        } catch (err) {
            console.error('Error loading settlements:', err);
            setError('Failed to load settlements');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = (settlement) => {
        setSelectedSettlement(settlement);
        setPaymentAmount(settlement.Amount.toString());
        setError('');
        setShowPaymentModal(true);
    };

    const handleFinalizeSplits = async () => {
        try {
            const response = await getGroupSettlements(groupId);
            setFinalizedSettlements(response.data);
            setShowFinalizedModal(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Error finalizing splits');
        }
    };

    const handleProcessPayment = async () => {
        try {
            if (!paymentAmount || parseFloat(paymentAmount) !== selectedSettlement.Amount) {
                setError('Payment amount must match the required amount');
                return;
            }

            await processPayment(selectedSettlement.SettlementID, parseFloat(paymentAmount));
            setShowPaymentModal(false);
            loadSettlements();
        } catch (err) {
            setError(err.response?.data?.detail || 'Error processing payment');
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString();
    };

    if (loading) {
        return <div>Loading settlements...</div>;
    }

    return (
        <div className="settlements-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>All Settlements</h2>
                {groupId && (
                    <Button variant="primary" onClick={handleFinalizeSplits}>
                        Finalize Splits
                    </Button>
                )}
            </div>

            {error && !showPaymentModal && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                    {error}
                </Alert>
            )}

            <Card>
                <Card.Body>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Group</th>
                                <th>From</th>
                                <th>To</th>
                                <th>Amount</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {settlements.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center">
                                        No settlements found
                                    </td>
                                </tr>
                            ) : (
                                settlements.map((settlement) => (
                                    <tr key={settlement.SettlementID}>
                                        <td>{settlement.GroupName}</td>
                                        <td>{settlement.PayerName}</td>
                                        <td>{settlement.ReceiverName}</td>
                                        <td>${settlement.Amount.toFixed(2)}</td>
                                        <td>{formatDate(settlement.DueDate)}</td>
                                        <td>
                                            <span className={`badge ${
                                                settlement.Status === 'Pending' ? 'bg-warning' :
                                                settlement.Status === 'Confirmed' ? 'bg-success' :
                                                'bg-secondary'
                                            }`}>
                                                {settlement.Status}
                                            </span>
                                        </td>
                                        <td>
                                            {settlement.Status === 'Pending' && (
                                                <Button 
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handlePayment(settlement)}
                                                >
                                                    Pay Now
                                                </Button>
                                            )}
                                            {settlement.Status === 'Confirmed' && (
                                                <span className="text-success">
                                                    Paid on {formatDate(settlement.PaymentDate)}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Payment Modal */}
            <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Process Payment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedSettlement && (
                        <div>
                            <div className="payment-details p-3 mb-4 border rounded bg-light">
                                <h5 className="mb-3">Payment Details</h5>
                                <p className="mb-2">
                                    <strong>Payment Required: </strong>
                                    <span className="text-primary">${selectedSettlement.Amount.toFixed(2)}</span>
                                </p>
                                <p className="mb-2">
                                    <strong>From: </strong>{selectedSettlement.PayerName}
                                </p>
                                <p className="mb-2">
                                    <strong>To: </strong>{selectedSettlement.ReceiverName}
                                </p>
                                <p className="mb-2">
                                    <strong>Due by: </strong>{formatDate(selectedSettlement.DueDate)}
                                </p>
                                <p className="mb-0">
                                    <strong>Group: </strong>{selectedSettlement.GroupName}
                                </p>
                            </div>
                            
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Enter Payment Amount</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        isInvalid={!!error}
                                    />
                                    <Form.Text className="text-muted">
                                        Amount must match the required payment exactly
                                    </Form.Text>
                                </Form.Group>
                            </Form>
                            
                            {error && (
                                <Alert variant="danger" className="mt-3">
                                    {error}
                                </Alert>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleProcessPayment}>
                        Confirm Payment
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Finalized Settlements Modal */}
            <Modal 
                show={showFinalizedModal} 
                onHide={() => setShowFinalizedModal(false)}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Finalized Settlements</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {finalizedSettlements.length === 0 ? (
                        <Alert variant="info">
                            No settlements to finalize.
                        </Alert>
                    ) : (
                        <div>
                            <Table striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Amount</th>
                                        <th>Due Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {finalizedSettlements.map((settlement) => (
                                        <tr key={settlement.SettlementID}>
                                            <td>{settlement.PayerName}</td>
                                            <td>{settlement.ReceiverName}</td>
                                            <td>${settlement.Amount.toFixed(2)}</td>
                                            <td>{formatDate(settlement.DueDate)}</td>
                                            <td>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => {
                                                        setShowFinalizedModal(false);
                                                        handlePayment(settlement);
                                                    }}
                                                >
                                                    Pay Now
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowFinalizedModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Settlements;