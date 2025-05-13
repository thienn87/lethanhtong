import { useState, useCallback, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/**
 * Custom hook to handle receipt data, PDF generation, and API submission
 * 
 * @param {Object} studentData - Student data
 * @param {string} transactionId - Transaction ID
 * @param {string} currentMonth - Current month
 * @param {string} noiDungHoa - Receipt description
 * @param {number} totalFeeAmount - Total fee amount
 * @param {Array} processedFees - Processed fees data
 * @param {Function} prepareTransactionData - Function to prepare transaction data
 * @param {string} domain - API domain
 * @param {string} pendingInvoiceId - Pending invoice ID if any
 * @param {Function} onSuccess - Callback function on successful submission
 * @returns {Object} Receipt data and functions
 */
export const useReceiptData = ({
  studentData,
  transactionId,
  currentMonth,
  noiDungHoa,
  totalFeeAmount,
  processedFees,
  prepareTransactionData,
  domain,
  pendingInvoiceId,
  onSuccess
}) => {
  const [receiptData, setReceiptData] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const receiptRef = useRef(null);

  /**
   * Generate receipt preview and submit to API simultaneously
   * @returns {Promise<Object>} Receipt data
   */
  const generateReceiptAndSubmit = useCallback(async () => {
    try {
      if (!studentData) {
        throw new Error("No student data available");
      }
      
      // Filter checked fees
      const checkedFees = processedFees.filter(fee => fee.isChecked);
      if (!checkedFees.length) {
        throw new Error("No fees selected");
      }
      
      // Calculate total amount
      const totalPaidAmount = checkedFees.reduce(
        (sum, fee) => sum + parseFloat(fee.amount_paid || 0), 
        0
      );
      
      // Generate receipt description
      const selectedMaHP = checkedFees.map(fee => fee.code);
      const noiDung = noiDungHoa || `Thu ${selectedMaHP.join(", ")} tháng ${currentMonth}`;
      
      // Create preview receipt data
      const previewData = {
        soChungTu: transactionId,
        tenHocSinh: studentData.name,
        mshs: studentData.mshs || "",
        lop: studentData ? `${studentData.grade}${studentData.class}` : "",
        dienGiai: noiDung,
        note: noiDung,
        soTien: totalPaidAmount,
        ngayThu: new Date().toISOString(),
        student: studentData,
        invoice_id: transactionId,
        student_name: studentData.name,
        class: studentData ? `${studentData.grade}${studentData.class}` : "",
        amount_paid: totalPaidAmount,
        invoice_details: noiDung,
        created_at: new Date().toISOString(),
        transactions: checkedFees.map(fee => ({
          id: `preview-${fee.code}`,
          paid_code: fee.code,
          amount_paid: parseFloat(fee.amount_paid || 0),
          tuition_name: fee.name || fee.code,
          created_at: new Date().toISOString()
        })),
        isSubmitting: true // Flag to indicate submission in progress
      };
      
      // Update receipt data state
      setReceiptData(previewData);
      
      // Start API submission
      setIsSubmitting(true);
      
      // Prepare transaction data for API
      const transactionData = prepareTransactionData();
      
      // Prepare payload
      const payload = {
        invoice_id: transactionId,
        invoice_details: noiDung,
        mshs: studentData.mshs,
        transaction_data: transactionData,
        month: currentMonth,
        status: 'completed',
        pending_invoice_id: pendingInvoiceId
      };
      
      // Submit to API
      const response = await fetch(`${domain}/api/payment/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to process payment: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.status !== 'success') {
        throw new Error(result.message || 'Unknown error occurred');
      }
      
      // Update receipt with actual data from server
      const updatedReceiptData = {
        ...previewData,
        soChungTu: result.data.invoice_id,
        invoice_id: result.data.invoice_id,
        ngayThu: result.data.created_at,
        created_at: result.data.created_at,
        isSubmitting: false
      };
      
      setReceiptData(updatedReceiptData);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(result.data);
      }
      
      setToastMessage("Giao dịch đã được xử lý thành công");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      return updatedReceiptData;
      
    } catch (error) {
      console.error("Error processing payment:", error);
      
      // Update receipt to show error state
      if (receiptData) {
        setReceiptData({
          ...receiptData,
          isSubmitting: false,
          hasError: true,
          errorMessage: error.message
        });
      }
      
      setToastMessage(`Lỗi khi xử lý giao dịch: ${error.message}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    studentData, 
    processedFees, 
    noiDungHoa, 
    currentMonth, 
    transactionId, 
    prepareTransactionData, 
    domain, 
    pendingInvoiceId, 
    onSuccess
  ]);

  /**
   * Generate and handle PDF actions
   * @param {boolean} openInNewTab - Whether to open in new tab
   */
  const handlePdfAction = useCallback(async (openInNewTab = false) => {
    setPdfLoading(true);
    try {
      // Use the current receipt element in the DOM
      if (receiptRef.current) {
        // Generate PDF using html2canvas and jsPDF
        const element = receiptRef.current;
        const canvas = await html2canvas(element, { 
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true
        });
        
        const imgData = canvas.toDataURL("image/png");
        
        // Create PDF in landscape A5 format
        // A5 dimensions: 210 x 148 mm (landscape: 148 x 210 mm)
        const pdf = new jsPDF({
          orientation: "landscape", // Set to landscape
          unit: "mm",
          format: "a5" // Set to A5 format
        });
        
        // Calculate dimensions to maintain aspect ratio
        const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm for A5 landscape
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 148mm for A5 landscape
        
        // Calculate scaling to fit the content properly
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        
        // Calculate centered position
        const xOffset = (pdfWidth - imgWidth * ratio) / 2;
        const yOffset = (pdfHeight - imgHeight * ratio) / 2;
        
        // Add image to PDF with proper scaling and centering
        pdf.addImage(
          imgData, 
          "PNG", 
          xOffset, 
          yOffset, 
          imgWidth * ratio, 
          imgHeight * ratio
        );
        
        // Add processing watermark if applicable
        if (receiptData?.isSubmitting) {
          pdf.setTextColor(200, 0, 0);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(30);
          pdf.text("ĐANG XỬ LÝ", pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() / 2, {
            align: "center",
            angle: 45
          });
        }
        
        if (openInNewTab) {
          // Open PDF in new tab
          const pdfBlob = pdf.output('blob');
          const blobUrl = URL.createObjectURL(pdfBlob);
          window.open(blobUrl, '_blank');
        } else {
          // Download the PDF
          const filename = receiptData?.isSubmitting 
            ? `bienlai-processing-${studentData?.mshs}-${transactionId}.pdf`
            : `bienlai-${studentData?.mshs}-${transactionId}.pdf`;
          pdf.save(filename);
        }
        
        setToastMessage(openInNewTab ? "Đã mở biên lai trong tab mới" : "Đã tải xuống biên lai");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        throw new Error("Receipt element not found");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      setToastMessage("Lỗi khi tạo PDF: " + error.message);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setPdfLoading(false);
    }
  }, [studentData, transactionId, receiptData]);

  return {
    receiptData,
    setReceiptData,
    receiptRef,
    pdfLoading,
    isSubmitting,
    showToast,
    setShowToast,
    toastMessage,
    setToastMessage,
    handlePdfAction,
    generateReceiptAndSubmit
  };
};