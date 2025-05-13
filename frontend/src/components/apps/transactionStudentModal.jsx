import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense, lazy } from "react";
import { Dialog, DialogHeader, DialogBody, DialogFooter, Button, Spinner } from "@material-tailwind/react";
import { format } from "date-fns";
import { Config } from "../config";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Toast } from "../polaris/toast";
import { useTuitionFeeData } from "./hooks/useTuitionFeeData";
import { usePaymentDistribution } from "./hooks/usePaymentDistribution";
import { useReceiptData } from "./hooks/useReceiptData";

const TransactionHeader = lazy(() => import("./transaction/TransactionHeader"));
const TransactionTable = lazy(() => import("./transaction/TransactionTable"));
const ReceiptView = lazy(() => import("./transaction/ReceiptView"));

const MODAL_STATUS = {
  UNSUBMITTED: "unsubmitted",
  SUBMITTED: "submitted",
  VIEWING_RECEIPT: "viewing_receipt",
};

const TransactionStudentModal = ({ isOpen, onClose, mshs, studentName, studentClass, size, studentData = null }) => {
  const domain = Config();
  const [showReceipt, setShowReceipt] = useState(false);
  const [noiDungHoaDown, setNoiDungHoaDown] = useState('');
  const [selectedMaHP, setSelectedMaHP] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [modalStatus, setModalStatus] = useState(MODAL_STATUS.UNSUBMITTED);
  const [pendingInvoiceId, setPendingInvoiceId] = useState(null);
  const [feesInitialized, setFeesInitialized] = useState(false);
  const [dataFetchInitiated, setDataFetchInitiated] = useState(false);
  const [processedFees, setProcessedFees] = useState([]);
  
  // Create a data reference for the student using the passed data or defaults
  const dataRef = useRef({
    mshs: mshs,
    name: studentName,
    grade: studentClass ? studentClass.charAt(0) : "",
    class: studentClass ? studentClass.substring(1) : "",
    sur_name: studentData?.sur_name || "",
    full_name: studentData?.full_name || studentName,
    // Include any other fields that might be needed
  });

  // Update dataRef when studentData changes
  useEffect(() => {
    if (studentData) {
      dataRef.current = {
        ...dataRef.current,
        ...studentData,
        // Ensure these fields are always set correctly
        mshs: mshs || studentData.mshs,
        name: studentData.name || studentName,
        grade: studentData.grade || (studentClass ? studentClass.charAt(0) : ""),
        class: studentData.class || (studentClass ? studentClass.substring(1) : "")
      };
    }
  }, [studentData, mshs, studentName, studentClass]);

  const currentDay = useMemo(() => format(new Date(), "dd/MM/yyyy"), []);
  
  // Use the tuition fee data hook
  const {
    loading: feeDataLoading,
    feeTable,
    currentMonth,
    transactionId,
    error: feeDataError,
    fetchTuitionFeeData,
    pendingInvoice,
    totalFeeAmount,
    deletePendingInvoice
  } = useTuitionFeeData(mshs);
  console.log('aaa');
  // Initialize fees from feeTable
  useEffect(() => {
    if (
      feeTable?.processedFees &&
      Array.isArray(feeTable.processedFees) &&
      !feesInitialized
    ) {
      const initializedFees = feeTable.processedFees
        .map(fee => ({
          ...fee,
          isChecked: true,
          amount_paid: fee.amount_paid ?? fee.suggested_payment ?? 0,
          note: fee.note ?? '',
        }))
        .sort((a, b) => {
          const aIsHP = a.code && a.code.includes('HP');
          const bIsHP = b.code && b.code.includes('HP');
          if (aIsHP && !bIsHP) return -1;
          if (!aIsHP && bIsHP) return 1;
          return 0;
        });
      setProcessedFees(initializedFees);
      setFeesInitialized(true);
      if (initializedFees.length > 0 && currentMonth) {
        const newSelectedMaHP = initializedFees.map(fee => fee.code);
        setSelectedMaHP(newSelectedMaHP);
        setNoiDungHoaDown(`THU ${newSelectedMaHP.join(", ")} THÁNG ${currentMonth}`);
      }
    }
  }, [feeTable, feesInitialized, currentMonth]);

  // Set pending invoice ID
  useEffect(() => {
    if (pendingInvoice && pendingInvoice.id) {
      setPendingInvoiceId(pendingInvoice.id);
    }
  }, [pendingInvoice]);

  // Use the payment distribution hook
  const {
    totalPaymentAmount,
    setTotalPaymentAmount,
    distributePayment,
    handleTotalPaymentChange
  } = usePaymentDistribution(processedFees, setProcessedFees);

  // Prepare transaction data for submission
  const prepareTransactionData = useCallback(() => {
    return processedFees
      .filter(fee => fee.isChecked)
      .map(fee => {
        const amountPaid = fee.isAmountModified 
          ? Number(fee.amount_paid) 
          : (fee.suggested_payment || 0);
        if (fee.isNewRow) {
          return {
            code: fee.code,
            amount: amountPaid,
            note: fee.note || "",
            name: fee.name || fee.code,
            isNewRow: true,
            groupcode: fee.groupcode || "OTHER"
          };
        }
        return {
          code: fee.code,
          amount: amountPaid,
          note: fee.note || ""
        };
      });
  }, [processedFees]);
 
  // Use the receipt data hook
  const {
    receiptData,
    receiptRef,
    pdfLoading,
    isSubmitting,
    showToast: receiptShowToast,
    setShowToast: setReceiptShowToast,
    toastMessage: receiptToastMessage,
    setToastMessage: setReceiptToastMessage,
    handlePdfAction,
    generateReceiptAndSubmit
  } = useReceiptData({
    studentData: dataRef.current,
    transactionId,
    currentMonth,
    noiDungHoa: noiDungHoaDown,
    totalFeeAmount,
    processedFees,
    prepareTransactionData,
    domain,
    pendingInvoiceId,
    onSuccess: async (data) => {
      setPendingInvoiceId(null);
      await fetchTuitionFeeData("invoice");
      setModalStatus(MODAL_STATUS.SUBMITTED);
    }
  });
 
  // Sync toast states
  useEffect(() => {
    if (receiptShowToast) {
      setShowToast(true);
      setToastMessage(receiptToastMessage);
      
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [receiptShowToast, receiptToastMessage]);

  // Handle noi dung change
  const handleNoiDungChange = useCallback((event) => {
    setNoiDungHoaDown(event.target.value);
  }, []);

  // Show table when fees are loaded
  useEffect(() => {
    if (processedFees && processedFees.length > 0) {
      setIsInitialLoad(false);
      setShowTable(true);
    }
  }, [processedFees]);

  // Update modal status when receipt is shown
  useEffect(() => {
    if (showReceipt) {
      setModalStatus(MODAL_STATUS.VIEWING_RECEIPT);
    } else if (modalStatus === MODAL_STATUS.VIEWING_RECEIPT) {
      setModalStatus(MODAL_STATUS.SUBMITTED);
    }
  }, [showReceipt, modalStatus]);

  // Handle checkbox change
  const handleCheck = useCallback((code, status) => {
    setProcessedFees(prev => {
      const newData = prev.map(fee =>
        fee.code === code ? { ...fee, isChecked: status } : fee
      );
      const checkedFees = newData.filter(fee => fee.isChecked);
      const newSelectedMaHP = checkedFees.map(fee => fee.code);
      setSelectedMaHP(newSelectedMaHP);
      if (checkedFees.length > 0 && currentMonth) {
        setNoiDungHoaDown(`THU ${newSelectedMaHP.join(", ")} THÁNG ${currentMonth}`);
      } else {
        setNoiDungHoaDown('');
      }
      return newData;
    });
  }, [currentMonth]);

  // Handle paid amount change
  const handlePaidAmount = useCallback((code, amount_paid) => {
    setProcessedFees(prev => prev.map(fee =>
      fee.code === code ? { ...fee, amount_paid, isAmountModified: true } : fee
    ));
  }, []);

  // Handle debt amount change
  const handleDebt = useCallback((code, default_amount) => {
    setProcessedFees(prev => prev.map(fee =>
      fee.code === code ? { ...fee, default_amount } : fee
    ));
  }, []);

  // Handle note change
  const handleNote = useCallback((code, note) => {
    setProcessedFees(prev => prev.map(fee =>
      fee.code === code ? { ...fee, note } : fee
    ));
  }, []);

  // Handle fee code change
  const handleFeeCode = useCallback((code, newCode) => {
    setProcessedFees(prev => prev.map(fee =>
      fee.code === code ? { ...fee, code: newCode } : fee
    ));
  }, []);

  // Handle fee name change
  const handleFeeName = useCallback((code, name) => {
    setProcessedFees(prev => prev.map(fee =>
      fee.code === code ? { ...fee, name } : fee
    ));
  }, []);

  // Add new row
  const addNewRow = useCallback(() => {
    setProcessedFees(prev => [
      ...prev,
      {
        code: `OT-${Date.now()}`,
        name: "",
        default_amount: 0,
        opening_debt_balance: 0,
        remaining_amount: 0,
        suggested_payment: 0,
        amount_paid: 0,
        isNewRow: true,
        isChecked: true,
        groupcode: "OTHER",
        note: "",
      },
    ]);
  }, []);

  // Handle submit transaction
  const handleSubmitTransaction = useCallback(async () => {
    try {
      if (!dataRef.current) {
        console.error("No student data available");
        setToastMessage("Không có dữ liệu học sinh");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }
      
      const isChecked = processedFees.filter((fee) => fee.isChecked);
      if (!isChecked.length) {
        setToastMessage("Chọn học phí muốn thu");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }
      
      // Generate receipt and submit to API simultaneously
      await generateReceiptAndSubmit();
      
      // Show the receipt
      setModalStatus(MODAL_STATUS.VIEWING_RECEIPT);
      setShowReceipt(true);
      
    } catch (error) {
      console.error("Error in transaction submission:", error.message);
      setToastMessage(`Đã xảy ra lỗi: ${error.message}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  }, [
    dataRef,
    processedFees,
    generateReceiptAndSubmit,
    setModalStatus,
    setShowReceipt,
    setToastMessage,
    setShowToast
  ]);

  // Format currency
  const formatCurrency = useCallback((amount) => {
    if (!amount && amount !== 0) return "0";
    return parseFloat(amount).toLocaleString("vi-VN");
  }, []);

  // Load data when modal opens - optimized to prevent multiple API calls
  useEffect(() => {
    if (isOpen && mshs && !dataFetchInitiated) {
      setDataFetchInitiated(true);
      fetchTuitionFeeData("tuition");
      setFeesInitialized(false);
      setShowReceipt(false);
      setModalStatus(MODAL_STATUS.UNSUBMITTED);
    } else if (!isOpen) {
      // Reset the flag when modal closes
      setDataFetchInitiated(false);
    }
  }, [isOpen, mshs, fetchTuitionFeeData, dataFetchInitiated]);

  // Check if can view receipt
  const canViewReceipt = modalStatus === MODAL_STATUS.SUBMITTED || 
                        (showTable && processedFees.some(fee => fee.isChecked));

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} 
            handler={onClose} 
            size={ size || "xxl"}
            className="max-w-6xl mx-auto" >
      <DialogHeader className="flex justify-between items-center p-4 border-b">
        <h3 className="font-bold text-lg">Thu học phí - {studentName} ({mshs})</h3>
        <Button
          variant="text"
          color="blue-gray"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </Button>
      </DialogHeader>
      
      <DialogBody className="p-0 overflow-y-auto max-h-[70vh]">
        <div className="transition-opacity duration-300 ease-in-out">
          {!showReceipt ? (
            <div className="bg-white animate-fade-in">
              <div className="p-4 space-y-4">
                <Suspense fallback={<div className="flex justify-center py-4"><Spinner className="h-8 w-8 text-violet-800" /></div>}>
                  <TransactionHeader 
                    studentName={studentName}
                    studentData={dataRef.current}
                    transactionId={transactionId}
                    currentDay={currentDay}
                    currentMonth={currentMonth}
                    noiDungHoaDown={noiDungHoaDown}
                    onNoiDungChange={handleNoiDungChange}
                  />
                </Suspense>
                
                {(feeDataLoading && isInitialLoad) ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <Spinner className="h-12 w-12 text-violet-800" />
                    <p className="mt-4 text-gray-700">Đang tải dữ liệu...</p>
                  </div>
                ) : feeDataError ? (
                  <div className="text-red-500 text-center p-4">
                    <p className="text-xl font-bold mb-2">Lỗi khi tải dữ liệu</p>
                    <p>{feeDataError}</p>
                  </div>
                ) : (!processedFees || processedFees.length === 0) ? (
                  <p className="text-gray-700 text-center py-4">Không có dữ liệu học phí cho học sinh này.</p>
                ) : showTable ? (
                  <Suspense fallback={
                    <div className="w-full flex justify-center items-center py-8">
                      <Spinner className="h-8 w-8 text-violet-800" />
                    </div>
                  }>
                    <TransactionTable 
                      processedFees={processedFees}
                      feeTable={feeTable}
                      handleCheck={handleCheck}
                      handlePaidAmount={handlePaidAmount}
                      handleDebt={handleDebt}
                      handleNote={handleNote}
                      handleFeeCode={handleFeeCode}
                      handleFeeName={handleFeeName}
                      formatCurrency={formatCurrency}
                      addNewRow={addNewRow}
                      totalPaymentAmount={totalPaymentAmount}
                      setTotalPaymentAmount={setTotalPaymentAmount}
                      distributePayment={distributePayment}
                      handleTotalPaymentChange={handleTotalPaymentChange}
                    />
                  </Suspense>
                ) : (
                  <div className="w-full flex justify-center items-center py-8">
                    <Spinner className="h-8 w-8 text-violet-800" />
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end p-4 gap-4 border-t bg-gray-50">
                <Button
                  className="bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-none"
                  onClick={onClose}
                >
                  Đóng
                </Button>
                <Button
                  className={isSubmitting ? "bg-violet-300 text-white shadow-md" : "bg-violet-700 hover:bg-violet-800 text-white shadow-md"}
                  disabled={isSubmitting || !showTable || modalStatus === MODAL_STATUS.SUBMITTED || !processedFees.some(fee => fee.isChecked)}
                  onClick={() => {
                    if (!isSubmitting && modalStatus !== MODAL_STATUS.SUBMITTED) {
                      handleSubmitTransaction();
                    }
                  }}
                >
                  {modalStatus === MODAL_STATUS.SUBMITTED ? "Đã thu học phí" : "Thu Học Phí"}
                </Button>
                <Button
                  className={`${canViewReceipt ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300"} text-white shadow-md`}
                  disabled={!canViewReceipt}
                  onClick={() => setShowReceipt(true)}
                >
                  In biên lai
                </Button>
              </div>
            </div>
          ) : (
            <Suspense fallback={<div className="flex justify-center py-8"><Spinner className="h-8 w-8 text-violet-800" /></div>}>
              <div className="animate-fade-in">
                <ReceiptView 
                  onBack={() => setShowReceipt(false)}
                  onClose={onClose}
                  receiptRef={receiptRef}
                  receiptData={receiptData}
                  handlePdfAction={handlePdfAction}
                  pdfLoading={pdfLoading}
                  isSubmitting={isSubmitting}
                />
              </div>
            </Suspense>
          )}
        </div>
      </DialogBody>
      
      {showToast && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}
    </Dialog>
  );
};

export default TransactionStudentModal;