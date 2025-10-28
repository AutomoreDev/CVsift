import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions } from '../js/firebase-config';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../utils/dateUtils';
import { formatCurrency } from '../utils/currency';
import useCurrency from '../hooks/useCurrency';
import { CompactCurrencySelector } from '../components/CurrencySelector';
import {
  ArrowLeft,
  Users,
  TrendingUp,
  DollarSign,
  MessageSquare,
  FileText,
  Activity,
  Calendar,
  BarChart3,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  Smartphone
} from 'lucide-react';

export default function MasterAccountDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [expandedSubMaster, setExpandedSubMaster] = useState(null);
  const [detailedUsage, setDetailedUsage] = useState({});
  const { convertAndFormat, convertPrice, formatPrice, currency, currencyInfo, loading: currencyLoading } = useCurrency();

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const getUsage = httpsCallable(functions, 'getSubMasterUsage');
      const result = await getUsage();

      if (result.data.success) {
        setUsageData(result.data);
      } else {
        setError(result.data.message || 'Failed to load usage data');
      }
    } catch (err) {
      console.error('Error loading usage data:', err);
      setError(err.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsageData();
    setRefreshing(false);
  };

  const loadDetailedUsage = async (subMasterId) => {
    try {
      const getDetailed = httpsCallable(functions, 'getSubMasterDetailedUsage');
      const result = await getDetailed({ subMasterId, monthsBack: 6 });

      if (result.data.success) {
        setDetailedUsage(prev => ({
          ...prev,
          [subMasterId]: result.data.monthlyData
        }));
      }
    } catch (err) {
      console.error('Error loading detailed usage:', err);
    }
  };

  const toggleSubMasterExpansion = (subMasterId) => {
    if (expandedSubMaster === subMasterId) {
      setExpandedSubMaster(null);
    } else {
      setExpandedSubMaster(subMasterId);
      if (!detailedUsage[subMasterId]) {
        loadDetailedUsage(subMasterId);
      }
    }
  };

  const exportToCSV = () => {
    if (!usageData || !usageData.subMasters) return;

    const headers = [
      'Email',
      'Display Name',
      'CV Uploads',
      'Chatbot Messages',
      'API Calls',
      'SMS Sent',
      'Team Members',
      'Job Specs',
      'Estimated Cost (ZAR)',
      'Created Date'
    ];

    const rows = usageData.subMasters.map(sm => [
      sm.email,
      sm.displayName,
      sm.currentMonth.cvUploads,
      sm.currentMonth.chatbotMessages,
      sm.currentMonth.apiCalls,
      sm.currentMonth.smsVerifications,
      sm.teamInfo.memberCount,
      sm.teamInfo.jobSpecCount,
      `R${sm.currentMonth.estimatedCost.toFixed(2)}`,
      formatDate(sm.createdAt)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sub-master-usage-${usageData.month.name}-${usageData.month.year}.csv`;
    a.click();
  };

  const formatCurrencyLocal = (amountZAR) => {
    if (currencyLoading) return 'Loading...';
    const converted = convertPrice(amountZAR);
    return formatPrice(converted, currency);
  };

  const exportIndividualInvoice = (subMaster) => {
    const monthName = usageData.month.name;
    const year = usageData.month.year;
    const invoiceDate = new Date().toLocaleDateString();
    const dueDate = new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString();

    // Generate unique invoice number
    const invoiceNumber = `INV-${year}${String(usageData.month.month).padStart(2, '0')}-${subMaster.subMasterId.substring(0, 8).toUpperCase()}`;

    const CV_COST = 1.20;
    const CHATBOT_COST = 0.35;
    const API_COST = 0.10;
    const SMS_COST = 0.50;

    const cvTotal = subMaster.currentMonth.cvUploads * CV_COST;
    const chatbotTotal = subMaster.currentMonth.chatbotMessages * CHATBOT_COST;
    const apiTotal = subMaster.currentMonth.apiCalls * API_COST;
    const smsTotal = (subMaster.currentMonth.smsVerifications || 0) * SMS_COST;
    const grandTotal = subMaster.currentMonth.estimatedCost;

    // Create PDF
    const doc = new jsPDF();

    // CVSift brand colors
    const primaryOrange = [249, 115, 22]; // orange-500
    const darkOrange = [234, 88, 12]; // orange-600
    const darkGray = [31, 41, 55]; // gray-800
    const lightGray = [243, 244, 246]; // gray-100

    // Header with CVSift branding
    doc.setFillColor(...primaryOrange);
    doc.rect(0, 0, 210, 40, 'F');

    // CVSift logo area (text-based)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('CVSift', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('CV Parsing & Job Matching Platform', 15, 28);
    doc.text('by Automore', 15, 34);

    // Invoice title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 155, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceNumber, 155, 28);

    // From/To section
    doc.setTextColor(...darkGray);
    doc.setFontSize(10);

    // From section
    doc.setFont('helvetica', 'bold');
    doc.text('From:', 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text('Automore (Pty) Ltd', 15, 62);
    doc.text('www.automore.co.za', 15, 68);
    doc.text('emma@automore.co.za', 15, 74);

    // Bill To section
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 110, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(subMaster.displayName, 110, 62);
    doc.text(subMaster.email, 110, 68);

    // Invoice details box
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, 85, 195, 85);

    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Date:', 15, 93);
    doc.text('Due Date:', 15, 100);
    doc.text('Period:', 15, 107);

    doc.setFont('helvetica', 'normal');
    doc.text(invoiceDate, 60, 93);
    doc.text(dueDate, 60, 100);
    doc.text(`${monthName} ${year}`, 60, 107);

    // Usage table
    autoTable(doc, {
      startY: 120,
      head: [['Description', 'Quantity', 'Rate (ZAR)', 'Amount (ZAR)']],
      body: [
        ['CV Processing', subMaster.currentMonth.cvUploads.toString(), `R ${CV_COST.toFixed(2)}`, formatCurrency(cvTotal)],
        ['AI Chatbot Messages', subMaster.currentMonth.chatbotMessages.toString(), `R ${CHATBOT_COST.toFixed(2)}`, formatCurrency(chatbotTotal)],
        ['API Calls', subMaster.currentMonth.apiCalls.toString(), `R ${API_COST.toFixed(2)}`, formatCurrency(apiTotal)],
        ['SMS Verifications', (subMaster.currentMonth.smsVerifications || 0).toString(), `R ${SMS_COST.toFixed(2)}`, formatCurrency(smsTotal)],
      ],
      theme: 'striped',
      headStyles: {
        fillColor: primaryOrange,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 40 },
      },
      margin: { left: 15, right: 15 },
    });

    // Total box
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFillColor(...lightGray);
    doc.rect(130, finalY, 65, 15, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...darkOrange);
    doc.text('TOTAL DUE:', 135, finalY + 10);
    doc.text(formatCurrency(grandTotal), 180, finalY + 10, { align: 'right' });

    // Account details section
    doc.setTextColor(...darkGray);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Account Details', 15, finalY + 35);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Plan: Enterprise (Usage-Based Billing)`, 15, finalY + 42);
    doc.text(`Team Members: ${subMaster.teamInfo.memberCount}`, 15, finalY + 48);
    doc.text(`Job Specifications: ${subMaster.teamInfo.jobSpecCount}`, 15, finalY + 54);
    doc.text(`Account Created: ${formatDate(subMaster.createdAt)}`, 15, finalY + 60);

    // Payment terms section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Payment Terms', 15, finalY + 75);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Payment is due within 30 days of invoice date.', 15, finalY + 82);
    doc.text('All amounts in South African Rand (ZAR).', 15, finalY + 88);
    doc.text('For billing inquiries, contact: emma@automore.co.za', 15, finalY + 94);

    // Footer
    doc.setDrawColor(...primaryOrange);
    doc.setLineWidth(1);
    doc.line(15, 280, 195, 280);

    doc.setTextColor(...primaryOrange);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for using CVSift!', 105, 287, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('Powered by Automore - www.automore.co.za', 105, 292, { align: 'center' });

    // Save PDF
    doc.save(`CVSift-Invoice-${invoiceNumber}-${subMaster.email.replace('@', '-')}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto mb-4 text-orange-500 animate-spin" />
          <p className="text-gray-600">Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white border border-red-200 shadow-lg rounded-xl">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="mb-2 text-2xl font-bold text-center text-gray-900">Error</h2>
          <p className="mb-6 text-center text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-3 font-semibold text-white transition-all bg-orange-500 rounded-lg hover:bg-orange-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4 mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 transition-colors hover:text-orange-500"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back</span>
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Master Account Dashboard</h1>
            </div>

            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <CompactCurrencySelector />
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 space-x-2 text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                <span className="text-sm font-medium">Refresh</span>
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center px-4 py-2 space-x-2 text-white transition-all bg-orange-500 rounded-lg hover:bg-orange-600"
              >
                <Download size={18} />
                <span className="text-sm font-medium">Export CSV</span>
              </button>
            </div>
          </div>

          {/* Month Indicator */}
          <div className="flex items-center mt-4 space-x-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>Showing data for: <span className="font-semibold text-gray-900">{usageData?.month?.name} {usageData?.month?.year}</span></span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8 mx-auto max-w-7xl">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Sub-Masters */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                <Users size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="mb-1 text-3xl font-bold text-gray-900">
              {usageData?.totals?.totalSubMasters || 0}
            </div>
            <div className="text-sm text-gray-600">Sub-Master Accounts</div>
          </div>

          {/* Total CV Uploads */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                <FileText size={24} className="text-green-600" />
              </div>
            </div>
            <div className="mb-1 text-3xl font-bold text-gray-900">
              {usageData?.totals?.totalCvUploads?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600">CV Uploads This Month</div>
          </div>

          {/* Total Chatbot Messages */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                <MessageSquare size={24} className="text-purple-600" />
              </div>
            </div>
            <div className="mb-1 text-3xl font-bold text-gray-900">
              {usageData?.totals?.totalChatbotMessages?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600">Chatbot Messages</div>
          </div>

          {/* Total Revenue */}
          <div className="p-6 bg-white border border-orange-200 shadow-sm rounded-xl ring-2 ring-orange-500 ring-opacity-20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                <DollarSign size={24} className="text-orange-600" />
              </div>
            </div>
            <div className="mb-1 text-3xl font-bold text-orange-600">
              {formatCurrency(usageData?.totals?.totalEstimatedRevenue || 0)}
            </div>
            <div className="text-sm text-gray-600">Estimated Revenue</div>
          </div>
        </div>

        {/* Sub-Master Usage Table */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="flex items-center space-x-2 text-xl font-bold text-gray-900">
              <Activity size={20} />
              <span>Sub-Master Account Usage</span>
            </h2>
          </div>

          {usageData?.subMasters && usageData.subMasters.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                      Sub-Master
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase">
                      CV Uploads
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase">
                      Chatbot
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase">
                      API Calls
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase">
                      SMS Sent
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase">
                      Team
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-right text-gray-600 uppercase">
                      Est. Cost
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase">
                      Actions
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usageData.subMasters.map((subMaster) => (
                    <React.Fragment key={subMaster.subMasterId}>
                      <tr className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{subMaster.displayName}</div>
                            <div className="text-sm text-gray-500">{subMaster.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <FileText size={16} className="text-gray-400" />
                            <span className="font-semibold text-gray-900">
                              {subMaster.currentMonth.cvUploads}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <MessageSquare size={16} className="text-gray-400" />
                            <span className="font-semibold text-gray-900">
                              {subMaster.currentMonth.chatbotMessages}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Activity size={16} className="text-gray-400" />
                            <span className="font-semibold text-gray-900">
                              {subMaster.currentMonth.apiCalls}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Smartphone size={16} className="text-gray-400" />
                            <span className="font-semibold text-gray-900">
                              {subMaster.currentMonth.smsVerifications || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {subMaster.teamInfo.memberCount} {subMaster.teamInfo.memberCount === 1 ? 'user' : 'users'}
                            </div>
                            <div className="text-gray-500">
                              {subMaster.teamInfo.jobSpecCount} jobspecs
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-bold text-orange-600">
                            {formatCurrency(subMaster.currentMonth.estimatedCost)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => exportIndividualInvoice(subMaster)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                            title="Export Invoice"
                          >
                            <Download size={14} />
                            <span>Invoice</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleSubMasterExpansion(subMaster.subMasterId)}
                            className="p-2 transition-colors rounded-lg hover:bg-gray-100"
                          >
                            {expandedSubMaster === subMaster.subMasterId ? (
                              <ChevronUp size={18} className="text-gray-600" />
                            ) : (
                              <ChevronDown size={18} className="text-gray-600" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {expandedSubMaster === subMaster.subMasterId && (
                        <tr>
                          <td colSpan="8" className="px-6 py-4 bg-gray-50">
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                {/* Account Info */}
                                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                                  <h4 className="mb-3 text-sm font-semibold text-gray-900">Account Info</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Plan:</span>
                                      <span className="font-medium text-gray-900 capitalize">{subMaster.plan}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Created:</span>
                                      <span className="font-medium text-gray-900">
                                        {formatDate(subMaster.createdAt)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">All-Time CVs:</span>
                                      <span className="font-medium text-gray-900">{subMaster.allTime.totalCvs}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Current Month Breakdown */}
                                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                                  <h4 className="mb-3 text-sm font-semibold text-gray-900">Cost Breakdown</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">CVs ({formatCurrencyLocal(1.20)}):</span>
                                      <span className="font-medium text-gray-900">
                                        {formatCurrencyLocal(subMaster.currentMonth.cvUploads * 1.20)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Messages ({formatCurrencyLocal(0.35)}):</span>
                                      <span className="font-medium text-gray-900">
                                        {formatCurrencyLocal(subMaster.currentMonth.chatbotMessages * 0.35)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">API ({formatCurrencyLocal(0.10)}):</span>
                                      <span className="font-medium text-gray-900">
                                        {formatCurrencyLocal(subMaster.currentMonth.apiCalls * 0.10)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">SMS ({formatCurrencyLocal(0.50)}):</span>
                                      <span className="font-medium text-gray-900">
                                        {formatCurrencyLocal((subMaster.currentMonth.smsVerifications || 0) * 0.50)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-gray-200">
                                      <span className="font-semibold text-gray-900">Total:</span>
                                      <span className="font-bold text-orange-600">
                                        {formatCurrencyLocal(subMaster.currentMonth.estimatedCost)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* API Call Breakdown */}
                                {subMaster.currentMonth.apiCalls > 0 && subMaster.currentMonth.apiBreakdown && (
                                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                                    <h4 className="mb-3 text-sm font-semibold text-gray-900">API Call Breakdown</h4>
                                    <div className="space-y-2 text-sm">
                                      {Object.entries(subMaster.currentMonth.apiBreakdown).map(([endpoint, count]) => (
                                        <div key={endpoint} className="flex justify-between items-center">
                                          <span className="text-gray-600 text-xs">
                                            {endpoint === 'calculateMatchScore' && '🎯 CV Match'}
                                            {endpoint === 'batchCalculateMatches' && '📊 Batch Match'}
                                            {endpoint === 'getAdvancedAnalytics' && '📈 Analytics'}
                                            {endpoint === 'generateCustomReport' && '📄 Custom Report'}
                                            {endpoint === 'unknown' && '❓ Other'}
                                            {!['calculateMatchScore', 'batchCalculateMatches', 'getAdvancedAnalytics', 'generateCustomReport', 'unknown'].includes(endpoint) && `🔧 ${endpoint}`}
                                          </span>
                                          <span className="font-medium text-gray-900">{count}</span>
                                        </div>
                                      ))}
                                      <div className="flex justify-between pt-2 border-t border-gray-200">
                                        <span className="font-semibold text-gray-900 text-xs">Total API Calls:</span>
                                        <span className="font-bold text-blue-600">{subMaster.currentMonth.apiCalls}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Historical Trend */}
                                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                                  <h4 className="mb-3 text-sm font-semibold text-gray-900">6-Month History</h4>
                                  {detailedUsage[subMaster.subMasterId] ? (
                                    <div className="space-y-1">
                                      {detailedUsage[subMaster.subMasterId].slice(-6).map((month, idx) => (
                                        <div key={idx} className="flex justify-between text-xs">
                                          <span className="text-gray-600">{month.monthName.substring(0, 3)} '{month.year.toString().substring(2)}:</span>
                                          <span className="font-medium text-gray-900">{formatCurrency(month.totalCost)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center py-4">
                                      <Loader2 size={20} className="text-gray-400 animate-spin" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">No sub-master accounts found</p>
            </div>
          )}
        </div>

        {/* Pricing Note */}
        <div className="p-6 mt-8 border border-blue-200 bg-blue-50 rounded-xl">
          <div className="flex items-start space-x-3">
            <BarChart3 size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="mb-2 font-semibold text-blue-900">Pricing Structure</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p>• CV Upload: {formatCurrencyLocal(1.20)} per CV processed</p>
                <p>• Chatbot Message: {formatCurrencyLocal(0.35)} per message sent</p>
                <p>• API Call: {formatCurrencyLocal(0.10)} per API request</p>
                <p>• SMS Verification: {formatCurrencyLocal(0.50)} per SMS sent</p>
                <p className="pt-2 text-xs text-blue-600">* Costs shown in {currencyInfo?.name} ({currency}). Base rates in ZAR. Adjust rates in the cloud function as needed.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
