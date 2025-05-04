import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Config } from "../config";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

function Sidebar() {
  const domain = Config();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(null);
  
  // Toggle section expansion
  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };
  
  // Check if a path is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  // Check if a section should be expanded
  const isSectionActive = (paths) => {
    return paths.some(path => location.pathname.startsWith(path));
  };
  
  // Initialize sections that should be expanded based on current path
  useState(() => {
    if (isSectionActive(['/hoc-sinh'])) setActiveSection('students');
    else if (isSectionActive(['/khoi', '/lop'])) setActiveSection('classes');
    else if (isSectionActive(['/hoc-phi', '/nhom-hoc-phi', '/thu-hoc-phi'])) setActiveSection('tuition');
    else if (isSectionActive(['/quan-ly-du-no', '/thong-ke-cong-no', '/lich-su-giao-dich'])) setActiveSection('transactions');
  }, []);

  const exportStudentData = async () => {
    try {
      const response = await fetch(
        `${domain}/api/students/export`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
  
        // Kiểm tra nếu phản hồi chứa `filePath`
        if (data.filePath) {
          // Mở liên kết trong tab mới
          window.open(data.filePath, "_blank");
          console.log("File link opened in a new tab");
        } else {
          console.log(data.message || "No file path provided in response");
        }
      } else {
        throw new Error("Error exporting student data");
      }
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  const exportTransactionData = () => {
    return;
  };

  return (
    <div className="relative flex h-[calc(100vh)] w-full max-w-[20rem] flex-col bg-gradient-to-b from-purple-900 to-purple-800 bg-clip-border p-4 text-gray-50 shadow-xl shadow-blue-gray-900/5 overflow-auto">
      <div className="mb-6 p-4">
        <h1 className="text-xl font-bold text-white">Quản lý học sinh</h1>
      </div>
      
      <div className="flex flex-col space-y-1">
        {/* Home menu */}
        <Link
          to="/"
          className={`flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 ${
            isActive('/') 
              ? "bg-white bg-opacity-20 text-white" 
              : "hover:bg-white hover:bg-opacity-10"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 mr-3"
          >
            <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
            <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
          </svg>
          <span className="font-medium">Trang chủ</span>
        </Link>

        {/* Student menu */}
        <div className="mt-4">
          <button
            onClick={() => toggleSection('students')}
            className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
              isSectionActive(['/hoc-sinh']) || activeSection === 'students'
                ? "bg-white bg-opacity-20 text-white" 
                : "hover:bg-white hover:bg-opacity-10"
            }`}
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 mr-3"
              >
                <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002c-.114.06-.227.119-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
                <path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.711 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286.921.304 1.83.634 2.726.99v1.27a1.5 1.5 0 0 0-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.66a6.727 6.727 0 0 0 .551-1.607 1.5 1.5 0 0 0 .14-2.67v-.645a48.549 48.549 0 0 1 3.44 1.667 2.25 2.25 0 0 0 2.12 0Z" />
                <path d="M4.462 19.462c.42-.419.753-.89 1-1.395.453.214.902.435 1.347.662a6.742 6.742 0 0 1-1.286 1.794.75.75 0 0 1-1.06-1.06Z" />
              </svg>
              <span className="font-medium">Học sinh</span>
            </div>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              className={`w-5 h-5 transition-transform ${activeSection === 'students' ? 'rotate-180' : ''}`}
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
          
          {activeSection === 'students' && (
            <div className="ml-4 pl-4 mt-1 border-l border-purple-600 space-y-1">
              <Link
                to="/hoc-sinh"
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  isActive('/hoc-sinh') && !isActive('/hoc-sinh/them-moi') && !isActive('/hoc-sinh/nhap-excel')
                    ? "bg-white bg-opacity-10 text-white" 
                    : "text-gray-200 hover:bg-white hover:bg-opacity-10"
                }`}
              >
                Danh sách học sinh
              </Link>
                
              <Link
                to="/hoc-sinh/them-moi"
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  isActive('/hoc-sinh/them-moi') 
                    ? "bg-white bg-opacity-10 text-white" 
                    : "text-gray-200 hover:bg-white hover:bg-opacity-10"
                }`}
              >
                Thêm mới học sinh
              </Link>
              
              <Link
                to="/hoc-sinh/nhap-excel"
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  isActive('/hoc-sinh/nhap-excel') 
                    ? "bg-white bg-opacity-10 text-white" 
                    : "text-gray-200 hover:bg-white hover:bg-opacity-10"
                }`}
              >
                <span className="flex items-center">
                  Nhập từ Excel
                </span>
              </Link>
              
              <button
                onClick={exportStudentData}
                className="flex items-center w-full text-left px-3 py-2 rounded-md text-sm text-gray-200 hover:bg-white hover:bg-opacity-10"
              >
                Xuất danh sách
              </button>
            </div>
          )}
        </div>

        {/* Group/ Class menu */}
        <div className="mt-1">
          <button
            onClick={() => toggleSection('classes')}
            className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
              isSectionActive(['/khoi', '/lop']) || activeSection === 'classes'
                ? "bg-white bg-opacity-20 text-white" 
                : "hover:bg-white hover:bg-opacity-10"
            }`}
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 mr-3"
              >
                <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
              </svg>
              <span className="font-medium">Khối - Lớp</span>
            </div>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              className={`w-5 h-5 transition-transform ${activeSection === 'classes' ? 'rotate-180' : ''}`}
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
          
          {activeSection === 'classes' && (
            <div className="ml-4 pl-4 mt-1 border-l border-purple-600 space-y-1">
              <Link
                to="/khoi"
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  isActive('/khoi') && !isActive('/khoi/them-moi')
                    ? "bg-white bg-opacity-10 text-white" 
                    : "text-gray-200 hover:bg-white hover:bg-opacity-10"
                }`}
              >
                Danh sách khối
              </Link>
              
              <Link
                to="/khoi/them-moi"
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  isActive('/khoi/them-moi') 
                    ? "bg-white bg-opacity-10 text-white" 
                    : "text-gray-200 hover:bg-white hover:bg-opacity-10"
                }`}
              >
                Thêm mới khối
              </Link>
              
              <Link
                to="/lop"
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  isActive('/lop') && !isActive('/lop/them-moi')
                    ? "bg-white bg-opacity-10 text-white" 
                    : "text-gray-200 hover:bg-white hover:bg-opacity-10"
                }`}
              >
                Danh sách lớp
              </Link>
              
              <Link
                to="/lop/them-moi"
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  isActive('/lop/them-moi') 
                    ? "bg-white bg-opacity-10 text-white" 
                    : "text-gray-200 hover:bg-white hover:bg-opacity-10"
                }`}
              >
                Thêm mới lớp
              </Link>
            </div>
          )}
        </div>

        {/* Tuition menu */}
        <div className="mt-1">
          <button
            onClick={() => toggleSection('tuition')}
            className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
              isSectionActive(['/hoc-phi', '/nhom-hoc-phi', '/thu-hoc-phi']) || activeSection === 'tuition'
                ? "bg-white bg-opacity-20 text-white" 
                : "hover:bg-white hover:bg-opacity-10"
            }`}
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 mr-3"
              >
                <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" />
                <path
                  fillRule="evenodd"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Học phí</span>
            </div>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              className={`w-5 h-5 transition-transform ${activeSection === 'tuition' ? 'rotate-180' : ''}`}
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
          
          {activeSection === 'tuition' && (
            <div className="ml-4 pl-4 mt-1 border-l border-purple-600 space-y-1">
              <Link
                to="/thu-hoc-phi"
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  isActive('/thu-hoc-phi')
                    ? "bg-white bg-opacity-10 text-white" 
                    : "text-gray-200 hover:bg-white hover:bg-opacity-10"
                }`}
              >
                Thu học phí
              </Link>
              
              <Link
                to="/nhom-hoc-phi"
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  isActive('/nhom-hoc-phi') && !isActive('/nhom-hoc-phi/them-moi')
                    ? "bg-white bg-opacity-10 text-white" 
                    : "text-gray-200 hover:bg-white hover:bg-opacity-10"
                }`}
              >
                Nhóm học phí
              </Link>
              
              <Link
                to="/nhom-hoc-phi/them-moi"
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  isActive('/nhom-hoc-phi/them-moi')
                    ? "bg-white bg-opacity-10 text-white" 
                    : "text-gray-200 hover:bg-white hover:bg-opacity-10"
                }`}
              >
                Thêm mới nhóm
              </Link>
            </div>
          )}
        </div>

        {/* Transactions menu */}
        <div className="mt-1">
          <button
            onClick={() => toggleSection('transactions')}
            className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
              isSectionActive(['/quan-ly-du-no', '/thong-ke-cong-no', '/lich-su-giao-dich']) || activeSection === 'transactions'
                ? "bg-white bg-opacity-20 text-white" 
                : "hover:bg-white hover:bg-opacity-10"
            }`}
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 mr-3"
              >
                <path
                  fillRule="evenodd"
                  d="M12 5.25c1.213 0 2.415.046 3.605.135a3.256 3.256 0 0 1 3.01 3.01c.044.583.077 1.17.1 1.759L17.03 8.47a.75.75 0 1 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 0 0-1.06-1.06l-1.752 1.751c-.023-.65-.06-1.296-.108-1.939a4.756 4.756 0 0 0-4.392-4.392 49.422 49.422 0 0 0-7.436 0A4.756 4.756 0 0 0 3.89 8.282c-.017.224-.033.447-.046.672a.75.75 0 1 0 1.497.092c.013-.217.028-.434.044-.651a3.256 3.256 0 0 1 3.01-3.01c1.19-.09 2.392-.135 3.605-.135Zm-6.97 6.22a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.752-1.751c.023.65.06 1.296.108 1.939a4.756 4.756 0 0 0 4.392 4.392 49.413 49.413 0 0 0 7.436 0 4.756 4.756 0 0 0 4.392-4.392c.017-.223.032-.447.046-.672a.75.75 0 0 0-1.497-.092c-.013.217-.028.434-.044.651a3.256 3.256 0 0 1-3.01 3.01 47.953 47.953 0 0 1-7.21 0 3.256 3.256 0 0 1-3.01-3.01 47.759 47.759 0 0 1-.1-1.759L6.97 15.53a.75.75 0 0 0 1.06-1.06l-3-3Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Giao dịch</span>
            </div>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              className={`w-5 h-5 transition-transform ${activeSection === 'transactions' ? 'rotate-180' : ''}`}
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
          
          {activeSection === 'transactions' && (
            <div className="ml-4 pl-4 mt-1 border-l border-purple-600 space-y-1">
              <Link
                to="/quan-ly-du-no"
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  isActive('/quan-ly-du-no') && !isActive('/quan-ly-du-no/giao-dich')
                    ? "bg-white bg-opacity-10 text-white" 
                    : "text-gray-200 hover:bg-white hover:bg-opacity-10"
                }`}
              >
                Tool hỗ trợ
              </Link>
              
              {/* <Link
                to="/quan-ly-du-no/giao-dich"
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  isActive('/quan-ly-du-no/giao-dich')
                    ? "bg-white bg-opacity-10 text-white" 
                    : "text-gray-200 hover:bg-white hover:bg-opacity-10"
                }`}
              >
                Quản lý giao dịch
              </Link> */}
              
              <Link
                to="/thong-ke-cong-no"
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  isActive('/thong-ke-cong-no')
                    ? "bg-white bg-opacity-10 text-white" 
                    : "text-gray-200 hover:bg-white hover:bg-opacity-10"
                }`}
              >
                Công nợ
              </Link>
              
              <Link
                to="/lich-su-giao-dich"
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  isActive('/lich-su-giao-dich')
                    ? "bg-white bg-opacity-10 text-white" 
                    : "text-gray-200 hover:bg-white hover:bg-opacity-10"
                }`}
              >
                Hóa đơn
              </Link>
            </div>
          )}
        </div>
        
        {/* User Guide menu - Added new item */}
        <div className="mt-4">
          <Link
            to="/user-guide"
            className={`flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 ${
              isActive('/user-guide') 
                ? "bg-white bg-opacity-20 text-white" 
                : "hover:bg-white hover:bg-opacity-10"
            }`}
          >
            <QuestionMarkCircleIcon className="w-5 h-5 mr-3" />
            <span className="font-medium">Hướng dẫn sử dụng</span>
          </Link>
        </div>
      </div>
      
      <div className="mt-auto pt-6 pb-4 px-4">
        <div className="bg-purple-950 bg-opacity-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-300">Phiên bản 1.0.0</p>
          <p className="text-xs text-gray-400 mt-1">© 2025 Trường Lê Thánh Tông</p>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;