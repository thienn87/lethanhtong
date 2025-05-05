
import { useState, useEffect } from "react";
import { Toast } from "../polaris/toast";
import { Config } from "../config";
import Select from "react-select";
import makeAnimated from "react-select/animated";

function AddListGroupTuition() {
  const [loading, setLoading] = useState(false);
  const [tuitionCode, setTuitionCode] = useState("");
  const [tuitionName, setTuitionName] = useState("");
  const [tuitionAmount, setTuitionAmount] = useState("");
  const [grade, setGrade] = useState(null);
  const [monthapply, setMonthapply] = useState(null);
  const [groupcode, setGroupcode] = useState(null);

  // Enhanced status for better feedback
  const [status, setStatus] = useState({ show: false, type: "", message: "" });
  // Success state to show persistent success message
  const [successMessage, setSuccessMessage] = useState("");
  // Track if form was successfully submitted
  const [formSubmitted, setFormSubmitted] = useState(false);

  const domain = Config();

  // Reset form fields
  const resetForm = () => {
    setTuitionCode("");
    setTuitionName("");
    setTuitionAmount("");
    setGrade(null);
    setMonthapply(null);
    setGroupcode(null);
  };

  const submitCreateTuitionGroup = async () => {
    if (!tuitionCode || !tuitionName || !tuitionAmount || !grade || !monthapply || !groupcode) {
      setStatus({
        show: true,
        type: "error",
        message: "Vui lòng điền đầy đủ thông tin!",
      });
      setTimeout(() => setStatus({ show: false, type: "", message: "" }), 3000);
      return;
    }
    
    setLoading(true);
    setStatus({ show: false, type: "", message: "" });
    setSuccessMessage("");
    
    try {
      const response = await fetch(
        `${domain}/api/tuitions/group/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: tuitionCode,
            name: tuitionName,
            default_amount: tuitionAmount,
            grade: grade,
            month_apply: monthapply,
            groupcode: groupcode,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Set success message that will persist on the page
        setSuccessMessage(`Tạo nhóm học phí "${tuitionName}" thành công!`);
        setFormSubmitted(true);
        
        // Show toast notification
        setStatus({
          show: true,
          type: "success",
          message: "Tạo nhóm học phí thành công!",
        });
        
        // Reset form for new entry
        resetForm();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setStatus({
          show: true,
          type: "error",
          message: errorData?.message || "Có lỗi xảy ra khi gửi dữ liệu!",
        });
      }
    } catch (error) {
      setStatus({
        show: true,
        type: "error",
        message: "Lỗi kết nối hoặc máy chủ!",
      });
    } finally {
      setLoading(false);
      // Hide toast after 3 seconds
      setTimeout(() => setStatus({ show: false, type: "", message: "" }), 3000);
    }
  };

  // Clear success message when starting a new form
  useEffect(() => {
    if (formSubmitted && (tuitionCode || tuitionName || tuitionAmount)) {
      setSuccessMessage("");
      setFormSubmitted(false);
    }
  }, [tuitionCode, tuitionName, tuitionAmount, formSubmitted]);

  const animatedComponents = makeAnimated();
  const monthsdropDownOptions = [
    { value: "0", label: "Chọn tháng" },
    { value: "1", label: "Tháng 1" },
    { value: "2", label: "Tháng 2" },
    { value: "3", label: "Tháng 3" },
    { value: "4", label: "Tháng 4" },
    { value: "5", label: "Tháng 5" },
    { value: "6", label: "Tháng 6" },
    { value: "7", label: "Tháng 7" },
    { value: "8", label: "Tháng 8" },
    { value: "9", label: "Tháng 9" },
    { value: "10", label: "Tháng 10" },
    { value: "11", label: "Tháng 11" },
    { value: "12", label: "Tháng 12" },
  ];

  const groupdropDownOptions = [
    { value: "0", label: "Chọn nhóm" },
    { value: "HP", label: "Học phí" },
    { value: "BT", label: "Bán trú" },
    { value: "NT", label: "Nội trú" },
    { value: "LP", label: "Lệ phí" },
    { value: "BH", label: "Bảo hiểm" },
  ];
  const gradeDropDownOptions = [
    { value: "null", label: "Chọn khối" },
    { value: "6", label: "Khối 6" },
    { value: "7", label: "Khối 7" },
    { value: "8", label: "Khối 8" },
    { value: "9", label: "Khối 9" },
    { value: "10", label: "Khối 10" },
    { value: "11", label: "Khối 11" },
    { value: "12", label: "Khối 12" },
  ];
  const monthsHandleSelectChange = (selectedVal) => {
    let months = selectedVal.map(function (item) {
      return item.value;
    });
    setMonthapply(months.toString());
  };
  const groupHandleSelectChange = (selectedVal) => {
    setGroupcode(selectedVal.value);
  };
  const gradeHandleSelectChange = (selectedVal) => {
    let grades = selectedVal.map((item) => item.value);
    setGrade(grades.toString());
  };

  return (
    <>
      <div className="grid gap-5 lg:gap-7.5">
        <div className="grid lg:grid-cols-1 gap-5 lg:gap-7.5 items-stretch">
          {/* Success message section */}
          {successMessage && (
            <div className="card bg-success-light border-success">
              <div className="card-body p-4">
                <div className="flex items-center">
                  <i className="ki-solid ki-check-circle text-success text-2xl mr-3"></i>
                  <div>
                    <h4 className="text-success font-medium">{successMessage}</h4>
                    <p className="text-sm mt-1">Bạn có thể tiếp tục thêm nhóm học phí mới.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card min-w-full">
            <div className="card-header">
              <h3 className="card-title">
                Thêm mới nhóm học phí, chi phí phải đóng
              </h3>
            </div>

            <div className="card-body">
              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                  <label className="w-full font-bold text-sm">Mã học phí <span className="text-danger">*</span></label>
                  <div className="input w-full">
                    <i className="ki-outline ki-code"></i>
                    <input
                      placeholder="Mã học phí"
                      required
                      type="text"
                      value={tuitionCode}
                      onChange={(event) => setTuitionCode(event.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="w-full font-bold text-sm">
                    Tên học phí <span className="text-danger">*</span>
                  </label>
                  <div className="input">
                    <i className="ki-outline ki-text"></i>
                    <input
                      placeholder="Tên học phí"
                      required
                      type="text"
                      value={tuitionName}
                      onChange={(event) => setTuitionName(event.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="w-full font-bold text-sm">
                    Nhóm học phí <span className="text-danger">*</span>
                  </label>
                  <Select
                    label="Nhóm học phí"
                    required
                    closeMenuOnSelect={true}
                    components={animatedComponents}
                    options={groupdropDownOptions}
                    className="w-full text-sm"
                    onChange={groupHandleSelectChange}
                    value={groupdropDownOptions.find(opt => opt.value === groupcode) || null}
                    placeholder="Chọn nhóm học phí"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="w-full font-bold text-sm">Số tiền <span className="text-danger">*</span></label>
                  <div className="input">
                    <i className="ki-outline ki-dollar"></i>
                    <input
                      placeholder="Số tiền"
                      required
                      type="number"
                      value={tuitionAmount}
                      onChange={(event) => setTuitionAmount(event.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="w-full font-bold text-sm">
                    Khối áp dụng <span className="text-danger">*</span>
                  </label>
                  <Select
                    label="Khối áp dụng"
                    required
                    closeMenuOnSelect={false}
                    components={animatedComponents}
                    options={gradeDropDownOptions}
                    isMulti
                    className="w-full text-sm"
                    onChange={gradeHandleSelectChange}
                    value={grade
                      ? gradeDropDownOptions.filter(opt => grade.split(",").includes(opt.value))
                      : []
                    }
                    placeholder="Chọn khối áp dụng"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="w-full font-bold text-sm">
                    Tháng áp dụng <span className="text-danger">*</span>
                  </label>
                  <Select
                    label="Tháng áp dụng"
                    required
                    closeMenuOnSelect={false}
                    components={animatedComponents}
                    options={monthsdropDownOptions}
                    isMulti
                    className="w-full text-sm"
                    onChange={monthsHandleSelectChange}
                    value={monthapply
                      ? monthsdropDownOptions.filter(opt => monthapply.split(",").includes(opt.value))
                      : []
                    }
                    placeholder="Chọn tháng áp dụng"
                  />
                </div>
              </div>
            </div>
            <div className="card-footer">
              <div className="flex justify-center gap-3">
                <button
                  onClick={submitCreateTuitionGroup}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                  disabled={loading}
                  type="button"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm mr-2"></span>
                      Đang xử lý...
                    </>
                  ) : "Thêm mới"}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-orange-400 text-white rounded-md hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                  type="button"
                  disabled={loading}
                >
                  Reset form
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast for loading */}
      <Toast status={loading}>Đang tải...</Toast>
      {/* Toast for status after create */}
    </>
  );
}

export default AddListGroupTuition;
