import React, { useState, useEffect, useRef } from "react";
import { Toast } from "../polaris/toast";
import { Config } from "../config";
import DebtUpdateSection from "./debt/DebtUpdateSection";
import { Button, Dialog, DialogHeader, DialogBody, DialogFooter, Spinner, Checkbox } from "@material-tailwind/react";
import { AcademicCapIcon } from "@heroicons/react/24/outline";

function OutstandingDebt() {
  const domain = Config();
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  
  // Debt update section states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  // New school year dialog states
  const [newSchoolYearDialogOpen, setNewSchoolYearDialogOpen] = useState(false);
  const [isProcessingNewYear, setIsProcessingNewYear] = useState(false);
  const [clearTransactions, setClearTransactions] = useState(false);
  const [newYearProgress, setNewYearProgress] = useState(0);
  const [newYearStatus, setNewYearStatus] = useState('');
  
  // EventSource reference for SSE
  const eventSourceRef = useRef(null);
  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  useEffect(() => {
    // Clean up any existing EventSource when component unmounts
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleMonthChange = (value) => {
    setSelectedMonth(parseInt(value));
  };

  // Function to open the new school year dialog
  const openNewSchoolYearDialog = () => {
    setNewSchoolYearDialogOpen(true);
    setClearTransactions(false);
    setNewYearProgress(0);
    setNewYearStatus('');
  };

  // Function to close the new school year dialog
  const closeNewSchoolYearDialog = () => {
    if (isProcessingNewYear) return; // Prevent closing while processing
    setNewSchoolYearDialogOpen(false);
  };

  // Function to create a new school year
  const createNewSchoolYear = async () => {
    if (isProcessingNewYear) return;

    if (!window.confirm("Bạn có chắc chắn muốn tạo năm học mới? Học sinh sẽ được chuyển lên lớp kế tiếp.")) {
      return;
    }

    setIsProcessingNewYear(true);
    setNewYearProgress(0);
    setNewYearStatus('Đang bắt đầu quá trình...');

    try {
      // Close existing EventSource if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create new SSE connection
      const eventSource = new EventSource(`${domain}/api/school-year/create-new?clearTransactions=${clearTransactions}`);
      eventSourceRef.current = eventSource;

      // Handle the start event
      eventSource.addEventListener('start', (event) => {
        const data = JSON.parse(event.data);
        setNewYearStatus(data.message);
        setNewYearProgress(5);
      });

      // Handle progress updates
      eventSource.addEventListener('progress', (event) => {
        const data = JSON.parse(event.data);
        setNewYearStatus(data.message);
        setNewYearProgress(data.progress);
      });

      // Handle backup progress
      eventSource.addEventListener('backup', (event) => {
        const data = JSON.parse(event.data);
        setNewYearStatus(`Đang sao lưu dữ liệu: ${data.message}`);
        setNewYearProgress(data.progress);
      });

      // Handle student promotion progress
      eventSource.addEventListener('promotion', (event) => {
        const data = JSON.parse(event.data);
        setNewYearStatus(`Đang cập nhật học sinh: ${data.message}`);
        setNewYearProgress(data.progress);
      });

      // Handle clear transactions progress (if selected)
      eventSource.addEventListener('clear', (event) => {
        const data = JSON.parse(event.data);
        setNewYearStatus(`Đang xóa dữ liệu giao dịch: ${data.message}`);
        setNewYearProgress(data.progress);
      });

      // Handle completion
      eventSource.addEventListener('complete', (event) => {
        const data = JSON.parse(event.data);
        setNewYearStatus(data.message);
        setNewYearProgress(100);
        
        // Close the EventSource
        eventSource.close();
        eventSourceRef.current = null;
        
        // Set processing to false after a delay to show the completion message
        setTimeout(() => {
          setIsProcessingNewYear(false);
        }, 2000);
        
        showToastMessage("Tạo năm học mới thành công!");
      });

      // Handle errors
      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        setNewYearStatus(`Lỗi kết nối với máy chủ. Vui lòng thử lại.`);
        
        // Close the EventSource
        eventSource.close();
        eventSourceRef.current = null;
        
        setIsProcessingNewYear(false);
        showToastMessage("Đã xảy ra lỗi khi tạo năm học mới.");
      };
    } catch (error) {
      console.error("Error creating new school year:", error);
      setNewYearStatus(`Lỗi: ${error.message}`);
      setIsProcessingNewYear(false);
      showToastMessage(`Lỗi khi tạo năm học mới: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Outstanding Debt Update Section */}
      <DebtUpdateSection 
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        handleMonthChange={handleMonthChange}
      />

      {/* New School Year Button */}
      <div className="w-full mb-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-t-lg">
          <h2 className="text-xl font-bold text-white">Quản lý năm học</h2>
          <p className="text-white opacity-80">Tạo năm học mới và cập nhật học sinh lên lớp</p>
        </div>
        <div className="p-6 flex justify-center">
          <Button
            color="indigo"
            className="flex items-center gap-2 bg-indigo-600 px-6 py-3"
            onClick={openNewSchoolYearDialog}
          >
            <AcademicCapIcon className="h-5 w-5" />
            Tạo năm học mới
          </Button>
        </div>
      </div>

      {/* New School Year Dialog */}
      <Dialog
        open={newSchoolYearDialogOpen}
        handler={closeNewSchoolYearDialog}
        size="xs"
      >
        <DialogHeader className="text-xl font-bold text-gray-800">
          Tạo năm học mới
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Thao tác này sẽ:
                </p>
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                  <li>Cập nhật học sinh lên 1 lớp (VD: 6→7, 7→8, 12→LT)</li>
                  <li>Tạo bản sao lưu cho dữ liệu hóa đơn và giao dịch</li>
                  <li>Tùy chọn xóa dữ liệu hóa đơn và giao dịch cũ</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="clearTransactions" 
              checked={clearTransactions} 
              onChange={() => setClearTransactions(!clearTransactions)}
              disabled={isProcessingNewYear}
            />
            <label htmlFor="clearTransactions" className="text-gray-700 font-medium">
              Xóa dữ liệu hóa đơn và giao dịch cũ
            </label>
          </div>

          {isProcessingNewYear && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{newYearStatus}</span>
                <span className="text-sm font-medium text-gray-700">{newYearProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${newYearProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </DialogBody>
        <DialogFooter className="space-x-2">
          <Button 
            color="red" 
            onClick={closeNewSchoolYearDialog}
            disabled={isProcessingNewYear}
          >
            Hủy
          </Button>
          <Button 
            color="indigo" 
            onClick={createNewSchoolYear}
            disabled={isProcessingNewYear}
            className="flex items-center gap-2"
          >
            {isProcessingNewYear ? (
              <>
                <Spinner className="h-4 w-4" />
                Đang xử lý...
              </>
            ) : (
              <>
                <AcademicCapIcon className="h-4 w-4" />
                Tạo năm học mới
              </>
            )}
          </Button>
        </DialogFooter>
      </Dialog>
      
      {/* Toast Notification - Fixed to only show when there's a message */}
      {showToast && <Toast status={showToast}>{toastMessage}</Toast>}
    </div>
  );
}

export default OutstandingDebt;