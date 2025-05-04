import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  CardHeader,
  Typography,
  Button,
  CardBody,
  Spinner,
  Progress,
} from "@material-tailwind/react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import ProcessingLog from "./ProcessingLog";
import { Config } from "../../config";

const DebtUpdateSection = ({ 
  selectedMonth,
  setSelectedMonth,
  handleMonthChange
}) => {
  const domain = Config();
  const [isProcessing, setIsProcessing] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [processedStudents, setProcessedStudents] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [processingLog, setProcessingLog] = useState([]);
  const [showProcessingLog, setShowProcessingLog] = useState(false);
  const eventSourceRef = useRef(null);
  const [processingStatus, setProcessingStatus] = useState('idle'); // 'idle', 'connecting', 'processing', 'completed', 'error'

  useEffect(() => {
    // Cleanup function to close SSE connection when component unmounts
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const addToLog = (message, type = "info") => {
    // Don't add "already has transactions" messages to the log
    if (message.includes("already has transactions for this month")) {
      return;
    }
    
    setProcessingLog(prev => [...prev, { message, type, timestamp: new Date() }]);
  };

  const updateOutstandingDebt = () => {
    if (!window.confirm(`Bạn có chắc chắn muốn cập nhật dư nợ cho tất cả học sinh trong tháng ${selectedMonth}?`)) {
      return;
    }
    
    // Reset state values
    setIsProcessing(true);
    setProcessingStatus('connecting');
    setUpdateProgress(0);
    setProcessedStudents(0);
    setTotalStudents(0);
    setSuccessCount(0);
    setErrorCount(0);
    setSkippedCount(0);
    setProcessingLog([]);
    setShowProcessingLog(true);
    
    addToLog(`Bắt đầu cập nhật dư nợ tháng ${selectedMonth}`, "info");
    
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    try {
      // Create new SSE connection with the correct endpoint
      const eventSource = new EventSource(`${domain}/api/transaction/update-outstanding-debt-batch?month=${selectedMonth}`);
      eventSourceRef.current = eventSource;
      
      // Handle the start event
      eventSource.addEventListener('start', (event) => {
        const data = JSON.parse(event.data);
        addToLog(data.message, "info");
        setTotalStudents(data.totalStudents);
        setProcessingStatus('processing');
      });
      
      // Handle progress updates
      eventSource.addEventListener('progress', (event) => {
        const data = JSON.parse(event.data);
        setProcessedStudents(data.processedCount);
        setUpdateProgress(data.progress);
        
        // Only update success count for actual record updates (not skipped ones)
        // The backend already tracks this correctly, so we just use its value
        setSuccessCount(data.successCount);
        setErrorCount(data.errorCount);
        
        // Log the last result if available
        if (data.lastResult) {
          const result = data.lastResult;
          if (result.success) {
            if (result.skipped) {
              // Increment skipped count but don't log "already has transactions" messages
              if (result.message.includes("already has transactions for this month")) {
                setSkippedCount(prev => prev + 1);
              } else {
                addToLog(`Học sinh ${result.mshs} (${result.name}): ${result.message}`, "warning");
                setSkippedCount(prev => prev + 1);
              }
            } else {
              // This is a successful update (not skipped)
              addToLog(`Học sinh ${result.mshs} (${result.name}): ${result.message}`, "success");
            }
          } else {
            addToLog(`Học sinh ${result.mshs} (${result.name}): ${result.message}`, "error");
          }
        }
      });
      
      // Handle completion
      eventSource.addEventListener('complete', (event) => {
        const data = JSON.parse(event.data);
        addToLog(data.message, "info");
        addToLog(`Đã cập nhật dư nợ cho ${data.successCount} học sinh thành công, ${data.errorCount} lỗi, ${skippedCount} bỏ qua`, "success");
        
        // Close the EventSource
        eventSource.close();
        eventSourceRef.current = null;
        
        // Set processing to false
        setIsProcessing(false);
        setProcessingStatus('completed');
      });
      
      // Handle errors
      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        addToLog(`Lỗi kết nối với máy chủ. Vui lòng thử lại.`, "error");
        
        // Close the EventSource
        eventSource.close();
        eventSourceRef.current = null;
        
        // Set processing to false
        setIsProcessing(false);
        setProcessingStatus('error');
      };
    } catch (error) {
      addToLog(`Lỗi: ${error.message}`, "error");
      setIsProcessing(false);
      setProcessingStatus('error');
    }
  };

  // Get status color based on processing status
  const getStatusColor = () => {
    switch (processingStatus) {
      case 'connecting':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-indigo-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  // Get status text based on processing status
  const getStatusText = () => {
    switch (processingStatus) {
      case 'connecting':
        return 'Đang kết nối...';
      case 'processing':
        return `Đang xử lý (${updateProgress}%)`;
      case 'completed':
        return 'Hoàn thành';
      case 'error':
        return 'Lỗi';
      default:
        return 'Chưa bắt đầu';
    }
  };

  return (
    <Card className="w-full mb-6 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader floated={false} shadow={false} className="rounded-none bg-gradient-to-r from-indigo-500 to-purple-600">
        <div className="mb-2 px-4 py-3">
          <Typography variant="h5" color="white">
            Cập nhật dư nợ
          </Typography>
          <Typography color="white" className="mt-1 font-normal opacity-80">
            Cập nhật dư nợ cho tất cả học sinh theo tháng, thường sẽ thực hiện vào cuối tháng.
          </Typography>
        </div>
      </CardHeader>
      <CardBody className="px-4 py-5">
        <div className="flex flex-col md:flex-row gap-4 items-end mb-4">
          <div className="w-full md:w-1/3">
            <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
              Chọn tháng
            </Typography>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                disabled={isProcessing}
                className="w-full p-2.5 border border-gray-300 rounded-md bg-white text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    Tháng {month}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <Button
              color="indigo"
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-3 shadow-md hover:shadow-lg transition-all duration-300 bg-violet-800"
              onClick={updateOutstandingDebt}
            >
              {isProcessing ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <ArrowPathIcon strokeWidth={2} className="h-4 w-4" />
                  Cập nhật dư nợ
                </>
              )}
            </Button>
          </div>
          {processingLog.length > 0 && (
            <div className="ml-auto">
              <Button
                variant="text"
                color="blue-gray"
                className="flex items-center gap-2"
                onClick={() => setShowProcessingLog(!showProcessingLog)}
              >
                {showProcessingLog ? "Ẩn nhật ký" : "Hiện nhật ký"}
              </Button>
            </div>
          )}
        </div>
        
        {/* Processing Status Bar */}
        {processingStatus !== 'idle' && (
          <div className="mb-6 mt-2">
            <div className="flex items-center mb-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()} mr-2`}></div>
              <Typography variant="small" color="blue-gray" className="font-medium">
                {getStatusText()}
              </Typography>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div 
                className={`h-2.5 rounded-full ${getStatusColor()} transition-all duration-300`} 
                style={{ width: `${updateProgress}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center">
                  <Typography variant="small" color="blue-gray">Đã xử lý:</Typography>
                  <Typography variant="small" color="blue-gray" className="font-bold">
                    {processedStudents}/{totalStudents}
                  </Typography>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center">
                  <Typography variant="small" color="green">Đã cập nhật:</Typography>
                  <Typography variant="small" color="green" className="font-bold">
                    {successCount}
                  </Typography>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center">
                  <Typography variant="small" color="red">Lỗi:</Typography>
                  <Typography variant="small" color="red" className="font-bold">
                    {errorCount}
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {showProcessingLog && processingLog.length > 0 && (
          <ProcessingLog logs={processingLog} />
        )}
      </CardBody>
    </Card>
  );
};

export default DebtUpdateSection;