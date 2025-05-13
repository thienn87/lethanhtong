import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense, lazy } from "react";
import { Button, Spinner } from "@material-tailwind/react";
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

const TransactionContent = ({ data, onClose }) => {
  const domain = Config();
  const dataRef = useRef(data);
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [noiDungHoaDown, setNoiDungHoaDown] = useState('');
  const [selectedMaHP, setSelectedMaHP] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [mshs, setMshs] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [modalStatus, setModalStatus] = useState(MODAL_STATUS.UNSUBMITTED);
  const [pendingInvoiceId, setPendingInvoiceId] = useState(null);
  const [feesInitialized, setFeesInitialized] = useState(false);

  // Preload TransactionTable and ReceiptView
  useEffect(() => {
    import("./transaction/TransactionTable");
    import("./transaction/ReceiptView");
  }, []);

  const currentDay = useMemo(() => format(new Date(), "dd/MM/yyyy"), []);
  const studentName = useMemo(() => {
    return dataRef.current ? `${dataRef.current.sur_name} ${dataRef.current.name}` : "";
  }, []);

  useEffect(() => {
    dataRef.current = data;
    if (data?.mshs) {
      setMshs(data.mshs);
    }
  }, [data]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (pendingInvoiceId) {
        e.preventDefault();
        e.returnValue = "Bạn có giao dịch chưa hoàn thành. Nếu rời khỏi trang, dữ liệu sẽ bị huỷ.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pendingInvoiceId]);

  useEffect(() => {
    const handleUnload = () => {
      if (pendingInvoiceId) {
        const url = `${domain}/api/invoice/delete/${pendingInvoiceId}`;
        navigator.sendBeacon(url, null);
      }
    };
    window.addEventListener("unload", handleUnload);
    return () => {
      window.removeEventListener("unload", handleUnload);
    };
  }, [pendingInvoiceId, domain]);

  

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

  const [processedFees, setProcessedFees] = useState([]);

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

  useEffect(() => {
    if (pendingInvoice && pendingInvoice.id) {
      setPendingInvoiceId(pendingInvoice.id);
    }
  }, [pendingInvoice]);


  
  const {
    totalPaymentAmount,
    setTotalPaymentAmount,
    distributePayment,
    handleTotalPaymentChange
  } = usePaymentDistribution(processedFees, setProcessedFees);

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
  // Sync toast states if needed
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

  const handleNoiDungChange = useCallback((event) => {
    setNoiDungHoaDown(event.target.value);
  }, []);

  useEffect(() => {
    if (processedFees && processedFees.length > 0) {
      setIsInitialLoad(false);
      setShowTable(true);
    }
  }, [processedFees]);

  useEffect(() => {
    if (showReceipt) {
      setModalStatus(MODAL_STATUS.VIEWING_RECEIPT);
    } else if (modalStatus === MODAL_STATUS.VIEWING_RECEIPT) {
      setModalStatus(MODAL_STATUS.SUBMITTED);
    }
  }, [showReceipt, modalStatus]);

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

  const handlePaidAmount = useCallback((code, amount_paid) => {
    setProcessedFees(prev => prev.map(fee =>
      fee.code === code ? { ...fee, amount_paid, isAmountModified: true } : fee
    ));
  }, []);

  const handleDebt = useCallback((code, default_amount) => {
    setProcessedFees(prev => prev.map(fee =>
      fee.code === code ? { ...fee, default_amount } : fee
    ));
  }, []);

  const handleNote = useCallback((code, note) => {
    setProcessedFees(prev => prev.map(fee =>
      fee.code === code ? { ...fee, note } : fee
    ));
  }, []);

  const handleFeeCode = useCallback((code, newCode) => {
    setProcessedFees(prev => prev.map(fee =>
      fee.code === code ? { ...fee, code: newCode } : fee
    ));
  }, []);

  const handleFeeName = useCallback((code, name) => {
    setProcessedFees(prev => prev.map(fee =>
      fee.code === code ? { ...fee, name } : fee
    ));
  }, []);

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

  

  // Find the handleSubmitTransaction function and replace it with this version
  const handleSubmitTransaction = useCallback(async () => {
    try {
      if (!dataRef.current) {
        console.error("No student data available");
        setToastMessage("Không có d��� liệu học sinh");
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
  // Add a new function to handle the actual payment submission
  const submitPaymentAfterPreview = useCallback(async () => {
    try {
      setLocalIsSubmitting(true);
      
      const transactionData = prepareTransactionData();
      const noiDung = noiDungHoaDown || `Thu ${selectedMaHP.join(", ")} tháng ${currentMonth}`;
      
      const payload = {
        invoice_id: transactionId,
        invoice_details: noiDung,
        mshs: dataRef.current.mshs,
        transaction_data: transactionData,
        month: currentMonth,
        status: 'completed',
        pending_invoice_id: pendingInvoiceId
      };
      
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
      
      // Update receipt with actual data from server using the hook
      // updateReceiptWithServerData(result.data);
      
      setPendingInvoiceId(null);
      await fetchTuitionFeeData("invoice");
      setModalStatus(MODAL_STATUS.SUBMITTED);
      
      setToastMessage("Giao dịch đã được xử lý thành công");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
    } catch (error) {
      console.error("API error:", error.message);
      setToastMessage(`Đã xảy ra lỗi khi cập nhật giao dịch: ${error.message}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setLocalIsSubmitting(false);
    }
  }, [
    domain,
    prepareTransactionData,
    noiDungHoaDown,
    selectedMaHP,
    currentMonth,
    transactionId,
    pendingInvoiceId,
    fetchTuitionFeeData,
    setModalStatus,
    setToastMessage,
    setShowToast
  ]);
  const formatCurrency = useCallback((amount) => {
    if (!amount && amount !== 0) return "0";
    return parseFloat(amount).toLocaleString("vi-VN");
  }, []);

  if ((feeDataLoading && isInitialLoad) && !showReceipt) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Spinner className="h-12 w-12 text-violet-800" />
        <p className="mt-4 text-white">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (feeDataError && !showReceipt) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Lỗi</h3>
          <Button
            variant="text"
            color="blue-gray"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </Button>
        </div>
        <div className="text-red-500 text-center">
          <p className="text-xl font-bold mb-2">Lỗi khi tải dữ liệu</p>
          <p>{feeDataError}</p>
        </div>
        <div className="flex justify-end mt-4">
          <Button
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-none"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      </div>
    );
  }

  if (!feeDataLoading && (!processedFees || processedFees.length === 0) && !showReceipt) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Thông báo</h3>
          <Button
            variant="text"
            color="blue-gray"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </Button>
        </div>
        <p className="text-gray-700 text-center py-4">Không có dữ liệu học phí cho học sinh này.</p>
        <div className="flex justify-end mt-4">
          <Button
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-none"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      </div>
    );
  }

  const canViewReceipt = modalStatus === MODAL_STATUS.SUBMITTED || 
                        (showTable && processedFees.some(fee => fee.isChecked));

  return (
    <div className="transition-opacity duration-300 ease-in-out">
      {!showReceipt ? (
        <div className="bg-white rounded-lg shadow-md animate-fade-in">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-bold text-lg">Thu học phí</h3>
            <Button
              variant="text"
              color="blue-gray"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </Button>
          </div>
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
            {showTable ? (
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
              disabled={isSubmitting || !showTable || modalStatus === MODAL_STATUS.SUBMITTED}
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
      {showToast && <Toast message={toastMessage} />}
    </div>
  );
};

export default React.memo(TransactionContent);