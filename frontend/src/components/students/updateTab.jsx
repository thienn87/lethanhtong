import { useState } from "react";
import * as XLSX from "xlsx";
import { Config } from "../config";
import Loading from "../../assets/loading.svg";
import Success from "../../assets/success.svg";
import Error from "../../assets/error.svg";

function UpdateStudentsTab() {
  const domain = Config();
  const [updateFile, setUpdateFile] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);
  const [updatePreviewData, setUpdatePreviewData] = useState(null);
  const [updateDragActive, setUpdateDragActive] = useState(false);

  // Handle file selection for update
  const handleUpdateFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setUpdateFile(selectedFile);
      previewExcel(selectedFile);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setUpdateDragActive(true);
    } else if (e.type === "dragleave") {
      setUpdateDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setUpdateDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setUpdateFile(droppedFile);
      previewExcel(droppedFile);
    }
  };

  // Preview Excel file contents
  const previewExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Ensure we have headers and at least one row of data
        if (jsonData.length >= 2) {
          const headers = jsonData[0];
          const rows = jsonData.slice(1, 6); // Preview first 5 rows
          
          // For update, ensure MSHS column exists
          if (!headers.includes('mshs')) {
            setUpdateResult({
              success: false,
              message: "File cập nhật phải có cột 'mshs' để xác định học sinh cần cập nhật."
            });
            return;
          }
          setUpdatePreviewData({ headers, rows, totalRows: jsonData.length - 1 });
        } else {
          setUpdateResult({
            success: false,
            message: "File không hợp lệ. Vui lòng kiểm tra định dạng file."
          });
        }
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        setUpdateResult({
          success: false,
          message: "Không thể đọc file Excel. Vui lòng kiểm tra định dạng file."
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Download sample Excel template for update
  const downloadUpdateTemplate = () => {
    // Sample data structure for update
    const sampleData = [
      [
        "mshs", "sur_name", "name", "day_of_birth", "grade", "class_id", 
        "gender", "discount", "stay_in", "leave_school", "fail_grade",
        "parent_name", "phone_number", "address", "day_in", "day_out"
      ],
      [
        "100001", "Nguyễn Văn", "An", "01/01/2010", "7", "A02", 
        "", "15", "", "", "",
        "", "0987654322", "", "", ""
      ],
      [
        "100002", "Trần Thị", "Bình", "", "", "", 
        "", "20", "TRUE", "", "",
        "", "", "789 Đường MNO, Quận PQR, TP.HCM", "", ""
      ],
      [
        "100003", "", "", "", "9", "C04", 
        "", "", "", "", "",
        "Lê Thị Mẹ", "0909090910", "", "", ""
      ]
    ];

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sampleData);

    // Add column widths and styling
    const colWidths = [
      { wch: 10 }, // mshs
      { wch: 15 }, // sur_name
      { wch: 10 }, // name
      { wch: 12 }, // day_of_birth
      { wch: 6 }, // grade
      { wch: 8 }, // class_id
      { wch: 8 }, // gender
      { wch: 8 }, // discount
      { wch: 8 }, // stay_in
      { wch: 10 }, // leave_school
      { wch: 10 }, // fail_grade
      { wch: 20 }, // parent_name
      { wch: 12 }, // phone_number
      { wch: 40 }, // address
      { wch: 12 }, // day_in
      { wch: 12 }, // day_out
    ];
    ws['!cols'] = colWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Mẫu Cập Nhật Học Sinh");

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, "mau_cap_nhat_hoc_sinh.xlsx");
  };

  // Handle form submission for update
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!updateFile) {
      setUpdateResult({
        success: false,
        message: "Vui lòng chọn file Excel để tải lên."
      });
      return;
    }

    setUpdateLoading(true);
    setUpdateResult(null);

    // Create FormData object to send file
    const formData = new FormData();
    formData.append("file", updateFile);

    try {
      const response = await fetch(`${domain}/api/students/update-batch`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setUpdateResult({
          success: true,
          message: `Đã cập nhật thành công ${data.updated || 0} học sinh.`,
          details: data
        });
        setUpdateFile(null);
        setUpdatePreviewData(null);
      } else {
        setUpdateResult({
          success: false,
          message: data.message || "Có lỗi xảy ra khi cập nhật dữ liệu.",
          details: data.errors
        });
      }
    } catch (error) {
      console.error("Error updating students:", error);
      setUpdateResult({
        success: false,
        message: "Lỗi kết nối đến máy chủ. Vui lòng thử lại sau."
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <>
      {updateResult && (
        <div className={`${updateResult.success ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"} border px-4 py-3 rounded-lg mb-6 flex items-start shadow-sm`}>
          <img width="24" src={updateResult.success ? Success : Error} alt="" className="mr-3 mt-0.5" />
          <div>
            <p className="font-medium">{updateResult.message}</p>
            {updateResult.details && updateResult.details.errors && (
              <ul className="mt-2 list-disc list-inside text-sm">
                {updateResult.details.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Cập Nhật Thông Tin Học Sinh</h2>
        </div>
        
        <div className="p-6">
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Hướng dẫn</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Tải xuống file mẫu Excel để xem định dạng yêu cầu</li>
              <li>Cột <strong>mshs</strong> là bắt buộc để xác định học sinh cần cập nhật</li>
              <li>Các cột để trống sẽ <strong>không được cập nhật</strong>, giữ nguyên giá trị hiện tại</li>
              <li>Chỉ điền thông tin vào các cột cần cập nhật</li>
              <li>Tải lên file Excel và nhấn "Cập nhật dữ liệu" để hoàn tất</li>
            </ol>
            <div className="mt-4">
              <button
                onClick={downloadUpdateTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Tải xuống file mẫu cập nhật
              </button>
            </div>
          </div>
          
          <form onSubmit={handleUpdateSubmit}>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Tải lên file Excel cập nhật</h3>
              
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center ${updateDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="update-file-upload"
                  className="hidden"
                  accept=".xlsx, .xls"
                  onChange={handleUpdateFileChange}
                />
                
                <label htmlFor="update-file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-lg font-medium text-gray-700">
                      {updateFile ? updateFile.name : "Kéo thả file vào đây hoặc nhấn để chọn file"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Chỉ chấp nhận file Excel (.xlsx, .xls)
                    </p>
                    {updateFile && (
                      <p className="text-sm text-green-600 mt-2">
                        Đã chọn file: {updateFile.name} ({(updateFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>
                </label>
              </div>
            </div>
            
            {updatePreviewData && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                  Xem trước dữ liệu cập nhật ({updatePreviewData.totalRows} học sinh)
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {updatePreviewData.headers.map((header, index) => (
                          <th 
                            key={index}
                            className={`px-6 py-3 text-left text-xs font-medium tracking-wider ${
                              header === 'mshs' ? 'bg-blue-100 text-blue-800' : 'text-gray-500'
                            } uppercase`}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {updatePreviewData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          {row.map((cell, cellIndex) => {
                            const header = updatePreviewData.headers[cellIndex];
                            const isEmpty = cell === undefined || cell === null || cell === "";
                            
                            return (
                              <td 
                                key={cellIndex}
                                className={`px-6 py-4 whitespace-nowrap text-sm ${
                                  header === 'mshs' 
                                    ? 'font-medium text-blue-800 bg-blue-50' 
                                    : isEmpty 
                                      ? 'text-gray-300 italic' 
                                      : 'text-gray-700 font-medium'
                                }`}
                              >
                                {isEmpty ? "(không thay đổi)" : cell?.toString()}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {updatePreviewData.totalRows > 5 && (
                  <p className="text-sm text-gray-500 mt-2 italic">
                    * Hiển thị 5/{updatePreviewData.totalRows} dòng dữ liệu
                  </p>
                )}
                
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-yellow-700">
                      <strong>Lưu ý:</strong> Chỉ những ô có giá trị mới được cập nhật. Các ô trống sẽ giữ nguyên giá trị hiện tại.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-8 pt-5 border-t border-gray-200">
              <div className="flex justify-center">
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-blue-700 text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                  disabled={updateLoading || !updateFile}
                >
                  {updateLoading ? <img width="24" src={Loading} alt="" className="mr-2" /> : null}
                  {updateLoading ? 'Đang xử lý...' : 'Cập nhật dữ liệu'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default UpdateStudentsTab;