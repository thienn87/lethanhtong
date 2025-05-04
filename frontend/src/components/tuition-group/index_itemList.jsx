import { useState, useCallback, useRef } from "react";
import { Toast } from "../polaris/toast";
import { Popup } from "../polaris/popup";
import { format } from "date-fns";
import { Card, Typography } from "@material-tailwind/react";
import makeAnimated from "react-select/animated";
import Select from "react-select";
import { Config } from "../config";
export function ItemList({ items, click, reFetch, listTuitionGroup }) {
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const domain = Config();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setModal({ ...modal, [name]: value });
  };

  const deleteTuition = async (tuitionCode) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${domain}/api/tuitions/delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: tuitionCode,
          }),
        }
      );

      const data = await response.json();
      if (data.status === "success") {
      } else {
      }
    } catch (error) {
      console.error("Error:", error.message);
    } finally {
    }
    setLoading(null);
  };
  const updateTuitionGroupToClass = useCallback(async () => {
    if (!modal) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${domain}/api/tuitions/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: modal.code,
            name: modal.name,
            groupcode: modal.group,
            default_amount: modal.default_amount,
            // classes: modal.classes,
            grade: modal.grade,
            month_apply: modal.month_apply,
          }),
        }
      );

      const data = await response.json();
      if (data.status === "success") {
        setModal(null);
        
      } else {
      }
    } catch (error) {
      console.error("Error:", error.message);
    } finally {
      setModal(null);
    }
    setLoading(null);
    reFetch(true);
  }, [modal]);
  if (!items) {
    return;
  } else {
    console.warn("Data type ItemList : ", items);
  }

  const ModalPopup = () => {
    if (modal === null) return;
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
    const groupHandleSelectChange = (selectedVal) => {
      modal.group = selectedVal.value;
      console.log(modal.group);
    };
    //Setup default value for apply months
    const month_applyArr = [];
    if (modal.month_apply !== null) {
      const month_apply = modal.month_apply.split(",");
      month_apply.forEach(function (i, index) {
        month_applyArr.push(monthsdropDownOptions[i]);
      });
    }

    //Setup default value for apply group

    const groupsArr = [];
    if (modal.group !== null) {
      const group = modal.group;
      console.log(modal.group);
      var indexArr = groupdropDownOptions
        .map(function (o) {
          return o.value;
        })
        .indexOf(modal.group);
      groupsArr.push(groupdropDownOptions[indexArr]);
    }

    const monthsHandleSelectChange = (selectedVal) => {
      let months = selectedVal.map(function (item) {
        return item.value;
      });
      modal.month_apply = months.toString();
    };

    return (
      <>
        <div
          className="modal open"
          data-modal="true"
          id="modal_welcome_message"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          style={{
            backgroundColor: "#0000007a",
            zIndex: "90",
            display: "block",
          }}
        >
          <div className="modal-content modal-center max-w-[800px] w-full">
            <div className="modal-header justify-end border-0 pt-5">
              <button
                className="btn btn-sm btn-icon btn-light"
                data-modal-dismiss="true"
                onClick={() => setModal(null)}
              >
                <svg
                  fill="#f1f1f1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M13.97 15.03a.75.75 0 1 0 1.06-1.06l-3.97-3.97 3.97-3.97a.75.75 0 0 0-1.06-1.06l-3.97 3.97-3.97-3.97a.75.75 0 0 0-1.06 1.06l3.97 3.97-3.97 3.97a.75.75 0 1 0 1.06 1.06l3.97-3.97 3.97 3.97Z" />
                </svg>
              </button>
            </div>
            <div className="modal-body flex flex-col items-center pt-0 pb-10">
              <h3 className="text-lg font-bold text-gray-900 text-center mb-7">
                Cập nhật học phí
              </h3>
              <div className="text-2sm text-center text-gray-700 mb-7 w-full grid grid-cols-4 gap-2">
                <p className="text-left">Mã học phí</p>
                <label className="input col-span-3">
                  <input
                    placeholder="Right icon"
                    type="text"
                    disabled
                    value={modal.code}
                  />
                  <button className="btn btn-icon">
                    <i className="ki-filled ki-copy"></i>
                  </button>
                </label>
                <p className="text-left mt-3">Tên học phí</p>
                <label className="input col-span-3">
                  <input
                    placeholder="Right icon"
                    name="name"
                    type="text"
                    defaultValue={modal.name}
                    onBlur={(e) => handleChange(e)}
                  />
                </label>
                <p className="text-left mt-3">Nhóm học phí</p>
                <Select
                  label="Tháng áp dụng"
                  required
                  closeMenuOnSelect={false}
                  defaultValue={groupsArr}
                  components={animatedComponents}
                  options={groupdropDownOptions}
                  className="w-full text-sm col-span-3"
                  onChange={groupHandleSelectChange}
                />
                <p className="text-left mt-3">Số tiền mặc định (vnđ)</p>
                <label className="input col-span-3">
                  <input
                    placeholder="Right icon"
                    type="text"
                    name="default_amount"
                    defaultValue={modal.default_amount.toLocaleString()}
                    onBlur={(e) => handleChange(e)}
                  />
                </label>
                <p className="text-left mt-3">Tên khối áp dụng</p>
                <label className="input col-span-3">
                  <input
                    placeholder=""
                    name="default_class"
                    type="text"
                    defaultValue={modal.grade
                      .replaceAll("[", "")
                      .replaceAll("]", "")
                      .replaceAll('"', "")}
                    onBlur={(e) =>
                      setModal({ ...modal, ["grade"]: e.target.value })
                    }
                  />
                </label>

                <p className="text-left mt-3">Tháng áp dung</p>
                <Select
                  label="Tháng áp dụng"
                  required
                  defaultValue={month_applyArr}
                  closeMenuOnSelect={false}
                  components={animatedComponents}
                  options={monthsdropDownOptions}
                  isMulti
                  className="w-full text-sm col-span-3"
                  onChange={monthsHandleSelectChange}
                />
              </div>
              <div className="flex justify-center mb-2">
                <div
                  className="btn btn-primary flex justify-center"
                  onMouseUp={() => updateTuitionGroupToClass()}
                >
                  Lưu lại
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const TABLE_HEAD = [
    "Tên học phí",
    "Mã học phí",
    "Khối áp dụng",
    "Tháng áp dụng",
    "Giá trị",
    "Cập nhật",
    "Xoá",
  ];

  const TABLE_ROWS = items;

  return (
    <>
      <Card className="h-full w-full overflow-scroll">
        <table className="w-full min-w-max table-auto text-left">
          <thead>
            <tr>
              {TABLE_HEAD.map((head) => (
                <th
                  key={head}
                  className="border-b border-blue-gray-100 bg-blue-gray-50 p-4"
                >
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal leading-none opacity-70"
                  >
                    {head}
                  </Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((item, index) => {
              const isLast = index === TABLE_ROWS.length - 1;
              const classes = isLast
                ? "p-4"
                : "p-4 border-b border-blue-gray-50";
              return (
                <tr key={item.mshs} className="even:bg-blue-gray-50/50">
                  <td className={classes}>
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {item.name}
                    </Typography>
                  </td>
                  <td className={classes}>
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {item.code}
                    </Typography>
                  </td>
                  <td className={classes}>
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {item.grade}
                    </Typography>
                  </td>
                  <td className={classes}>
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {item.month_apply}
                    </Typography>
                  </td>

                  <td className={classes}>
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      {item.default_amount.toLocaleString()}
                    </Typography>
                  </td>
                  <td className={classes}>
                    <a
                      className="btn btn-sm btn-icon btn-clear btn-light"
                      href="#"
                      onClick={(event) =>
                        setModal({
                          code: item.code,
                          name: item.name,
                          default_amount: item.default_amount,
                          grade: item.grade || "",
                          month_apply: item.month_apply || "",
                          group: item.group,
                        })
                      }
                    >
                      <div className="btn btn-sm btn-icon btn-clear btn-light">
                        <svg
                          className="w-[18px]"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M15.655 4.344a2.695 2.695 0 0 0-3.81 0l-.599.599-.009-.009-1.06 1.06.008.01-5.88 5.88a2.75 2.75 0 0 0-.805 1.944v1.922a.75.75 0 0 0 .75.75h1.922a2.75 2.75 0 0 0 1.944-.806l7.54-7.539a2.695 2.695 0 0 0 0-3.81Zm-4.409 2.72-5.88 5.88a1.25 1.25 0 0 0-.366.884v1.172h1.172c.331 0 .65-.132.883-.366l5.88-5.88-1.689-1.69Zm2.75.629.599-.599a1.195 1.195 0 1 0-1.69-1.689l-.598.599 1.69 1.689Z"
                          />
                        </svg>
                      </div>
                    </a>
                  </td>
                  <td className={classes}>
                    <a
                      className="btn btn-sm btn-icon btn-clear btn-light"
                      href="#"
                      onClick={() => setShowConfirmPopup(true)}
                    >
                      <div className="btn btn-sm btn-icon btn-clear btn-light">
                        <svg
                          className="w-[18px]"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M11.5 8.25a.75.75 0 0 1 .75.75v4.25a.75.75 0 0 1-1.5 0v-4.25a.75.75 0 0 1 .75-.75Z" />
                          <path d="M9.25 9a.75.75 0 0 0-1.5 0v4.25a.75.75 0 0 0 1.5 0v-4.25Z" />
                          <path
                            fill-rule="evenodd"
                            d="M7.25 5.25a2.75 2.75 0 0 1 5.5 0h3a.75.75 0 0 1 0 1.5h-.75v5.45c0 1.68 0 2.52-.327 3.162a3 3 0 0 1-1.311 1.311c-.642.327-1.482.327-3.162.327h-.4c-1.68 0-2.52 0-3.162-.327a3 3 0 0 1-1.311-1.311c-.327-.642-.327-1.482-.327-3.162v-5.45h-.75a.75.75 0 0 1 0-1.5h3Zm1.5 0a1.25 1.25 0 1 1 2.5 0h-2.5Zm-2.25 1.5h7v5.45c0 .865-.001 1.423-.036 1.848-.033.408-.09.559-.128.633a1.5 1.5 0 0 1-.655.655c-.074.038-.225.095-.633.128-.425.035-.983.036-1.848.036h-.4c-.865 0-1.423-.001-1.848-.036-.408-.033-.559-.09-.633-.128a1.5 1.5 0 0 1-.656-.655c-.037-.074-.094-.225-.127-.633-.035-.425-.036-.983-.036-1.848v-5.45Z"
                          />
                        </svg>
                      </div>
                    </a>
                  </td>
                  {showConfirmPopup && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-[0.05] flex justify-center items-center z-50">
                      <div className="bg-white shadow-lg rounded-lg p-6 w-11/12 max-w-3xl">
                        <div className="text-center text-gray-700 p-6">
                          <p className="mb-4">Bạn có chắc chắn muốn xóa thông tin này không?</p>
                          <div className="flex justify-center gap-4">
                            <button
                              className="btn btn-danger"
                              onClick={() => {
                                deleteTuition(item.code);
                                setShowConfirmPopup(false);
                                listTuitionGroup();
                              }}
                            >
                              Xác nhận
                            </button>
                            <button
                              className="btn btn-light"
                              onClick={() => setShowConfirmPopup(false)}
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <Toast status={loading}>Đang tải</Toast>
      <ModalPopup />
    </>
  );
}
