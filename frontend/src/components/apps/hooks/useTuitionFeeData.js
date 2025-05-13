import { useState, useCallback, useEffect, useRef } from 'react';
import { Config } from '../../config';

export const useTuitionFeeData = (mshs, isOpen) => {
  const domain = Config();
  const [loading, setLoading] = useState(false);
  const [feeTable, setFeeTable] = useState({});
  const [processedFees, setProcessedFees] = useState([]);
  const [currentMonth, setCurrentMonth] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [error, setError] = useState(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [pendingInvoice, setPendingInvoice] = useState(null);
  const fetchRef = useRef(false);

  const fetchTuitionFeeData = useCallback(async (action = "modal") => {
    if (!mshs || !isOpen || fetchRef.current) return null;
    try {
      fetchRef.current = true;
      setLoading(true);
      setError(null);
      
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const url = `${domain}/api/tuition-fee-listings/by-mshs?mshs=${encodeURIComponent(mshs)}&month=${currentMonth}&year=${currentYear}&action=${encodeURIComponent(action)}`;
      
      console.log("Fetching tuition fee data:", url); // Debug log
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) throw new Error(`Failed to fetch tuition fee data: ${response.statusText}`);
      
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        const feeData = result.data;
        setFeeTable(feeData);
        if (feeData.invoice_id) {
          setTransactionId(feeData.invoice_id);
          setPendingInvoice({
            id: feeData.invoice_id,
            mshs: mshs,
            month: currentMonth,
            year: currentYear
          });
        }
        setCurrentMonth(currentMonth.toString());
        setProcessedFees(feeData.processedFees || []);
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
      fetchRef.current = false;
    }
  }, [domain, mshs, isOpen]);

  const deletePendingInvoice = useCallback(async () => {
    if (pendingInvoice && pendingInvoice.id) {
      try {
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

  useEffect(() => {
    if (mshs && isOpen && !dataFetched) {
      fetchTuitionFeeData();
    }
  }, [mshs, isOpen, dataFetched, fetchTuitionFeeData]);

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
    deletePendingInvoice,
    totalFeeAmount: processedFees.reduce((sum, fee) => sum + (fee.suggested_payment || 0), 0)
  };
};