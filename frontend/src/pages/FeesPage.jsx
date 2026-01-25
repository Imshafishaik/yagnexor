import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, FileText, Search, TrendingUp } from 'lucide-react';
import api from '../services/api';

export default function FeesPage() {
  const [fees, setFees] = useState([]);
  const [filteredFees, setFilteredFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [feeForm, setFeeForm] = useState({
    student_id: '',
    fee_structure_id: '',
    amount_due: '',
    due_date: '',
    description: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    amount_paid: '',
    payment_date: '',
    payment_method: 'BANK_TRANSFER',
    transaction_reference: '',
    notes: '',
  });

  useEffect(() => {
    fetchFees();
  }, []);

  useEffect(() => {
    const filtered = fees.filter(
      (fee) =>
        fee.student_id?.toString().includes(searchTerm) ||
        fee.fee_structure_id?.toString().includes(searchTerm)
    );
    setFilteredFees(filtered);
  }, [searchTerm, fees]);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/fees');
      setFees(response.data.fees || []);
    } catch (error) {
      console.error('Error fetching fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeeInputChange = (e) => {
    const { name, value } = e.target;
    setFeeForm((prev) => ({
      ...prev,
      [name]: name === 'amount_due' ? parseFloat(value) : value,
    }));
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({
      ...prev,
      [name]: name === 'amount_paid' ? parseFloat(value) : value,
    }));
  };

  const handleCreateFee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees', feeForm);
      fetchFees();
      setShowFeeForm(false);
      setFeeForm({
        student_id: '',
        fee_structure_id: '',
        amount_due: '',
        due_date: '',
        description: '',
      });
    } catch (error) {
      console.error('Error creating fee record:', error);
      alert('Failed to create fee record');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/fees/${selectedFee.id}/payment`, paymentForm);
      fetchFees();
      setShowPaymentForm(false);
      setSelectedFee(null);
      setPaymentForm({
        amount_paid: '',
        payment_date: '',
        payment_method: 'BANK_TRANSFER',
        transaction_reference: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PARTIAL':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculatePendingAmount = (fee) => {
    return (fee.amount_due || 0) - (fee.amount_paid || 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <DollarSign className="text-green-600" />
              Fees Management
            </h1>
            <p className="text-gray-600 mt-1">Manage student fees, track payments, and send reminders</p>
          </div>
          <button
            onClick={() => setShowFeeForm(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus size={20} />
            Create Fee
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Fees Due</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  ₹{fees.reduce((sum, fee) => sum + (fee.amount_due || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Collected</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  ₹{fees.reduce((sum, fee) => sum + (fee.amount_paid || 0), 0).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Pending</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  ₹{fees.reduce((sum, fee) => sum + calculatePendingAmount(fee), 0).toLocaleString()}
                </p>
              </div>
              <FileText className="text-red-600" size={32} />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by student ID or fee structure ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Create Fee Modal */}
        {showFeeForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="bg-white border-b p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">Create Fee Record</h2>
                <button
                  onClick={() => setShowFeeForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateFee} className="p-6 space-y-4">
                <input
                  type="text"
                  name="student_id"
                  placeholder="Student ID"
                  value={feeForm.student_id}
                  onChange={handleFeeInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />

                <input
                  type="text"
                  name="fee_structure_id"
                  placeholder="Fee Structure ID"
                  value={feeForm.fee_structure_id}
                  onChange={handleFeeInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />

                <input
                  type="number"
                  name="amount_due"
                  placeholder="Amount Due"
                  value={feeForm.amount_due}
                  onChange={handleFeeInputChange}
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />

                <input
                  type="date"
                  name="due_date"
                  value={feeForm.due_date}
                  onChange={handleFeeInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />

                <textarea
                  name="description"
                  placeholder="Description (optional)"
                  value={feeForm.description}
                  onChange={handleFeeInputChange}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                ></textarea>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Create Fee
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFeeForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentForm && selectedFee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="bg-white border-b p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">Record Payment</h2>
                <button
                  onClick={() => {
                    setShowPaymentForm(false);
                    setSelectedFee(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddPayment} className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Student ID</p>
                  <p className="text-lg font-semibold text-gray-800">{selectedFee.student_id}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Amount Due</p>
                  <p className="text-lg font-semibold text-gray-800">₹{selectedFee.amount_due}</p>
                </div>

                <input
                  type="number"
                  name="amount_paid"
                  placeholder="Amount Paid"
                  value={paymentForm.amount_paid}
                  onChange={handlePaymentInputChange}
                  step="0.01"
                  max={calculatePendingAmount(selectedFee)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />

                <input
                  type="date"
                  name="payment_date"
                  value={paymentForm.payment_date}
                  onChange={handlePaymentInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />

                <select
                  name="payment_method"
                  value={paymentForm.payment_method}
                  onChange={handlePaymentInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="ONLINE">Online Payment</option>
                  <option value="OTHER">Other</option>
                </select>

                <input
                  type="text"
                  name="transaction_reference"
                  placeholder="Transaction Reference (optional)"
                  value={paymentForm.transaction_reference}
                  onChange={handlePaymentInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />

                <textarea
                  name="notes"
                  placeholder="Notes (optional)"
                  value={paymentForm.notes}
                  onChange={handlePaymentInputChange}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                ></textarea>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentForm(false);
                      setSelectedFee(null);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Fees List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : filteredFees.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No fees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Student</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount Due</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Paid</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Pending</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Due Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFees.map((fee) => (
                    <tr key={fee.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{fee.student_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">₹{fee.amount_due?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-green-600 font-semibold">
                        ₹{(fee.amount_paid || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600 font-semibold">
                        ₹{calculatePendingAmount(fee).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{fee.due_date}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(fee.status)}`}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedFee(fee);
                            setShowPaymentForm(true);
                          }}
                          className="bg-green-100 hover:bg-green-200 text-green-800 text-xs font-semibold px-3 py-1 rounded transition"
                        >
                          Pay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
