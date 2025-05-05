
import { useState } from 'react';
import { Toast } from "../polaris/toast";
import { Config } from "../config";

function AddGrade() {
    const domain = Config();
    const [loading, setLoading] = useState(false);
    const [grade, setGrade] = useState("");
    const [name, setName] = useState("");
    const [toast, setToast] = useState({ status: null, message: "", type: "success" });

    const submitCreateGrade = async () => {
        // Validate input
        if (!grade || !name) {
            setToast({ status: true, message: "Vui lòng nhập đầy đủ thông tin khối!", type: "error" });
            return;
        }
        setLoading(true);
        setToast({ status: null, message: "", type: "success" });

        try {
            const response = await fetch(`${domain}/api/grades/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    grade: grade,
                    name: name
                }),
            });

            const data = await response.json();

            if (response.ok && data.status) {
                setToast({ status: true, message: "Tạo khối thành công!", type: "success" });
                setGrade("");
                setName("");
            } else {
                // Handle duplicate or other backend errors
                let errorMsg = data?.message || "Có lỗi xảy ra khi tạo khối!";
                // Check for duplicate key error from backend
                if (
                    errorMsg.includes("duplicate key") ||
                    errorMsg.includes("đã tồn tại") ||
                    errorMsg.includes("Unique violation")
                ) {
                    errorMsg = "Khối này đã tồn tại!";
                }
                setToast({ status: true, message: errorMsg, type: "error" });
            }
        } catch (error) {
            setToast({ status: true, message: "Lỗi kết nối máy chủ!", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="grid gap-5 lg:gap-7.5">
                <div className="grid lg:grid-cols-1 gap-5 lg:gap-7.5 items-stretch">
                    <div className="card min-w-full">
                        <div className="card-header">
                            <h3 className="card-title">
                                Thêm mới khối
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-4 flex gap-6">
                                <div className="input">
                                    <i className="ki-outline ki-magnifier"></i>
                                    <input
                                        placeholder="Tên khối vd : 10"
                                        type="text"
                                        value={grade}
                                        onChange={(event) => setGrade(event.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="p-4 flex gap-6">
                                <div className="input">
                                    <i className="ki-outline ki-magnifier"></i>
                                    <input
                                        placeholder="Mã khối vd : 10"
                                        type="text"
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 flex">
                            <button
                                onClick={submitCreateGrade}
                                className={`mx-auto btn btn-primary bg-blue-600 flex justify-center ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                                disabled={loading}
                                type="button"
                            >
                                {loading ? "Đang xử lý..." : "Thêm mới"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default AddGrade;
