import { useState, useCallback, useEffect } from 'react';
import { Config } from '../../config';

/**
 * Custom hook to fetch and manage tuition fee data
 * @param {string} mshs - Student MSHS
 * @returns {Object} Tuition fee data and related functions
 */
export const useTuitionFeeData = (mshs) => {
  const domain = Config();
  const [loading, setLoading] = useState(false);
  const [feeTable, setFeeTable] = useState({});
  const [processedFees, setProcessedFees] = useState([]);
  const [currentMonth, setCurrentMonth] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [error, setError] = useState(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [pendingInvoice, setPendingInvoice] = useState(null);

  // Fetch tuition fee data
  const fetchTuitionFeeData = useCallback(
    async (action = "") => {
      if (!mshs) return null;
      try {
        setLoading(true);
        setError(null);
        
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        let url = `${domain}/api/tuition-fee-listings/by-mshs?mshs=${encodeURIComponent(mshs)}&month=${currentMonth}&year=${currentYear}`;
        if (action) {
          url += `&action=${encodeURIComponent(action)}`;
        }
        
        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        
        if (!response.ok) throw new Error("Failed to fetch tuition fee data");
        
        const result = await response.json();
        if (result.status === 'success' && result.data) {
        // Process the tuition fee data
        const feeData = result.data;
        
        // Set the fee table data
        setFeeTable(feeData);
        
        // Set transaction ID if available
        if (feeData.invoice_id) {
          setTransactionId(feeData.invoice_id);
          
          // Store the pending invoice information
          setPendingInvoice({
            id: feeData.invoice_id,
            mshs: mshs,
            month: currentMonth,
            year: currentYear
          });
        }
        
        // Set current month - use the current month from the API request
        setCurrentMonth(currentMonth.toString());
        
        // Process fees
        const processedFees = feeData.processedFees;
        setProcessedFees(processedFees);
        setDataFetched(true);
        return feeData;
      }
      
      return null;
      } catch (error) {
        console.error("Error fetching tuition fee data:", error);
        setError(error.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [domain, mshs]);
   
  // Delete pending invoice
  const deletePendingInvoice = useCallback(async () => {
    if (pendingInvoice && pendingInvoice.id) {
      try {
        // Format month to ensure it's 2 digits
        const formattedMonth = parseInt(pendingInvoice.month, 10);
        const response = await fetch(`${domain}/api/invoice/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoice_id: pendingInvoice.id,
            year: pendingInvoice.year,
            month: formattedMonth
          }),
        });
        
        if (!response.ok) {
          console.error("Failed to delete pending invoice");
        } else {
          console.log("Successfully deleted pending invoice:", pendingInvoice.id);
          setPendingInvoice(null);
        }
      } catch (error) {
        console.error("Error deleting pending invoice:", error);
      }
    }
  }, [domain, pendingInvoice]);

  // Fetch data when mshs changes and data hasn't been fetched yet
  useEffect(() => {
    if (mshs && !dataFetched) {
      fetchTuitionFeeData("modal");
    }
    
    // Reset data fetched flag when mshs changes
    if (!mshs) {
      setDataFetched(false);
      setProcessedFees([]);
      setFeeTable({});
      setCurrentMonth("");
      setTransactionId("");
      setError(null);
      
      // Delete pending invoice when component unmounts or mshs changes
      deletePendingInvoice();
    }
  }, [mshs, dataFetched, fetchTuitionFeeData, deletePendingInvoice]);

  // Cleanup pending invoice when component unmounts
  useEffect(() => {
    return () => {
      deletePendingInvoice();
    };
  }, [deletePendingInvoice]);

  return {
    loading,
    feeTable,
    processedFees,
    currentMonth,
    transactionId,
    error,
    fetchTuitionFeeData,
    pendingInvoice,
    deletePendingInvoice
  };
};