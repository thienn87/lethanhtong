import { useState } from "react";
import * as XLSX from "xlsx";
import { Config } from "../config";
import Loading from "../../assets/loading.svg";
import Success from "../../assets/success.svg";
import Error from "../../assets/error.svg";
import UpdateStudentsTab from "./updateTab";

function ImportStudents() {
  const domain = Config();
  const [activeTab, setActiveTab] = useState("import"); // "import" or "update"
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      previewExcel(selectedFile);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
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
          setPreviewData({ headers, rows, totalRows: jsonData.length - 1 });
        } else {
          setResult({
            success: false,
            message: "File không hợp lệ. Vui lòng kiểm tra định dạng file."
          });
        }
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        setResult({
          success: false,
          message: "Không thể đọc file Excel. Vui lòng kiểm tra định dạng file."
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Download sample Excel template
  const downloadSampleTemplate = () => {
    // Sample data structure
    const sampleData = [
      [
        "sur_name", "name", "day_of_birth", "grade", "class_id", 
        "gender", "discount", "stay_in", "leave_school", "fail_grade",
        "parent_name", "phone_number", "address", "day_in", "day_out"
      ],
      [
        "Nguyễn Văn", "An", "01/01/2010", "6", "A01", 
        "male", "0", "FALSE", "FALSE", "FALSE",
        "Nguyễn Văn Cha", "0987654321", "123 Đường ABC, Quận XYZ, TP.HCM", "01/09/2022", ""
      ],
      [
        "Trần Thị", "Bình", "15/05/2009", "7", "B02", 
        "female", "10", "TRUE", "FALSE", "FALSE",
        "Trần Văn Cha", "0123456789", "456 Đường DEF, Quận UVW, TP.HCM", "01/09/2021", ""
      ],
      [
        "Lê Hoàng", "Cường", "20/11/2008", "8", "C03", 
        "male", "0", "FALSE", "FALSE", "FALSE",
        "Lê Văn Cha", "0909090909", "789 Đường GHI, Quận RST, TP.HCM", "01/09/2020", ""
      ]
    ];

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sampleData);

    // Add column widths and styling
    const colWidths = [
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
    XLSX.utils.book_append_sheet(wb, ws, "Mẫu Nhập Học Sinh");

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, "mau_nhap_hoc_sinh.xlsx");
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setResult({
        success: false,
        message: "Vui lòng chọn file Excel để tải lên."
      });
      return;
    }

    setLoading(true);
    setResult(null);

    // Create FormData object to send file
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(`${domain}/api/students/import`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          message: `Đã nhập thành công ${data.imported || 0} học sinh.`,
          details: data
        });
        setFile(null);
        setPreviewData(null);
      } else {
        setResult({
          success: false,
          message: data.message || "Có lỗi xảy ra khi nhập dữ liệu.",
          details: data.errors
        });
      }
    } catch (error) {
      console.error("Error importing students:", error);
      setResult({
        success: false,
        message: "Lỗi kết nối đến máy chủ. Vui lòng thử lại sau."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Tab Navigation */}
      <div className="mb-6 flex border-b border-gray-200">
        <button
          className={`py-3 px-6 font-medium text-lg focus:outline-none ${
            activeTab === "import"
              ? "text-violet-700 border-b-2 border-violet-700"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("import")}
        >
          Nhập mới học sinh
        </button>
        <button
          className={`py-3 px-6 font-medium text-lg focus:outline-none ${
            activeTab === "update"
              ? "text-blue-700 border-b-2 border-blue-700"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("update")}
        >
          Cập nhật học sinh
        </button>
      </div>

      {/* Import Tab Content */}
      {activeTab === "import" && (
        <>
          {result && (
            <div className={`${result.success ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"} border px-4 py-3 rounded-lg mb-6 flex items-start shadow-sm`}>
              <img width="24" src={result.success ? Success : Error} alt="" className="mr-3 mt-0.5" />
              <div>
                <p className="font-medium">{result.message}</p>
                {result.details && result.details.errors && (
                  <ul className="mt-2 list-disc list-inside text-sm">
                    {result.details.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-800 to-violet-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Nhập Danh Sách Học Sinh Mới</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Hướng dẫn</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>Tải xuống file mẫu Excel để xem định dạng yêu cầu</li>
                  <li>Điền thông tin học sinh vào file Excel theo mẫu</li>
                  <li>Tải lên file Excel đã điền thông tin</li>
                  <li>Kiểm tra dữ liệu xem trước và nhấn "Nhập dữ liệu" để hoàn tất</li>
                </ol>
                <div className="mt-4">
                  <button
                    onClick={downloadSampleTemplate}
                    className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Tải xuống file mẫu
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Tải lên file Excel</h3>
                  
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive ? "border-violet-500 bg-violet-50" : "border-gray-300 hover:border-violet-400"}`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                    />
                    
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-lg font-medium text-gray-700">
                          {file ? file.name : "Kéo thả file vào đây hoặc nhấn để chọn file"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Chỉ chấp nhận file Excel (.xlsx, .xls)
                        </p>
                        {file && (
                          <p className="text-sm text-green-600 mt-2">
                            Đã chọn file: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
                
                {previewData && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                      Xem trước dữ liệu ({previewData.totalRows} học sinh)
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {previewData.headers.map((header, index) => (
                              <th 
                                key={index}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewData.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              {row.map((cell, cellIndex) => (
                                <td 
                                  key={cellIndex}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                >
                                  {cell?.toString() || ""}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {previewData.totalRows > 5 && (
                      <p className="text-sm text-gray-500 mt-2 italic">
                        * Hiển thị 5/{previewData.totalRows} dòng dữ liệu
                      </p>
                    )}
                  </div>
                )}
                
                <div className="mt-8 pt-5 border-t border-gray-200">
                  <div className="flex justify-center">
                    <button 
                      type="submit" 
                      className="px-6 py-3 bg-violet-800 text-white rounded-md hover:bg-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                      disabled={loading || !file}
                    >
                      {loading ? <img width="24" src={Loading} alt="" className="mr-2" /> : null}
                      {loading ? 'Đang xử lý...' : 'Nhập dữ liệu'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Update Tab Content */}
      {activeTab === "update" && <UpdateStudentsTab />}
    </div>
  );
}

export default ImportStudents;