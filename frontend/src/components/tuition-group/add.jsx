import { useState } from "react";
import { Toast } from "../polaris/toast";
import { Config } from "../config";
import Select from "react-select";
import makeAnimated from "react-select/animated";

function AddListGroupTuition() {
  const [loading, setLoading] = useState(false);
  const [tuitionCode, setTuitionCode] = useState(null);
  const [tuitionName, setTuitionName] = useState(null);
  const [tuitionAmount, setTuitionAmount] = useState(null);
  const [grade, setGrade] = useState(null);
  const [monthapply, setMonthapply] = useState(null);
  const [groupcode, setGroupcode] = useState(null);
  const domain = Config();
  // const [classes, setClasses] = useState(null);
  // const [group, setGroup] = useState(null);
  // const [apply_months, setApplyMonths] = useState(null);

  const submitCreateTuitionGroup = async () => {
    if (!tuitionCode || !tuitionName || !tuitionAmount || !grade || !monthapply ||  !groupcode) {
      alert("Vui lòng điền đầy đủ thông tin!");
      setLoading(false);
      return;
    }
    setLoading(true);
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
            // classes: classes,
            // group: group,
            // apply_months: apply_months,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.warn("Sent from tuition-group/add.jsx", data);
      } else {
        throw new Error("Error sending form data");
      }
    } catch (error) {
      console.error("Error:", error.message);
    } finally {
    }
    setLoading(false);
  };

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
          <div className="card min-w-full">
            <div className="card-header">
              <h3 className="card-title">
                Thêm mới nhóm học phí, chi phí phải đóng
              </h3>
            </div>

            <div className="card-body">
              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col  gap-2">
                  <label className="w-full font-bold text-sm">Mã học phí</label>
                  <div className="input w-full ">
                    <i className="ki-outline ki-magnifier"></i>
                    <input
                      placeholder="Mã học phí"
                      required
                      type="text"
                      defaultValue={tuitionCode}
                      onBlur={(event) => setTuitionCode(event.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col  gap-2">
                  <label className="w-full font-bold text-sm">
                    Tên học phí
                  </label>
                  <div className="input">
                    <i className="ki-outline ki-magnifier"></i>
                    <input
                      placeholder="Tên học phí"
                      required
                      type="text"
                      defaultValue={tuitionName}
                      onBlur={(event) => setTuitionName(event.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col  gap-2">
                  <label className="w-full font-bold text-sm">
                    Nhóm học phí
                  </label>
                  <Select
                    label="Nhóm học phí"
                    required
                    closeMenuOnSelect={false}
                    components={animatedComponents}
                    options={groupdropDownOptions}
                    className="w-full text-sm"
                    onChange={groupHandleSelectChange}
                  />
                </div>
                <div className="flex flex-col  gap-2">
                  <label className="w-full font-bold text-sm">Số tiền</label>
                  <div className="input">
                    <input
                      placeholder="Số tiền"
                      required
                      type="number"
                      defaultValue={tuitionAmount}
                      onBlur={(event) => setTuitionAmount(event.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col  gap-2">
                  <label className="w-full font-bold text-sm">
                    Khối áp dụng
                  </label>
                  {/* <div className="input">
                    <input
                      placeholder="Áp dụng cho Khối"
                      type="text"
                      defaultValue={classes}
                      onBlur={(event) => setClasses(event.target.value)}
                    />
                  </div> */}
                  <Select
                    label="Khối áp dụng"
                    required
                    closeMenuOnSelect={false}
                    components={animatedComponents}
                    options={gradeDropDownOptions}
                    isMulti
                    className="w-full text-sm"
                    onChange={gradeHandleSelectChange}
                  />
                </div>
                <div className="flex flex-col  gap-2">
                  <label className="w-full font-bold text-sm">
                    Tháng áp dụng
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
                  />
                </div>
              </div>
            </div>
            <div className="card-footer">
              <div className="flex justify-center">
                <div
                  onClick={() => submitCreateTuitionGroup()}
                  className="mx-auto btn btn-sm btn-primary"
                >
                  Thêm mới
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast status={loading}>Đang tải</Toast>
    </>
  );
}

export default AddListGroupTuition;
