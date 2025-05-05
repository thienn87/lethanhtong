import { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

import Loading from "../../assets/loading.svg"
import Success from "../../assets/success.svg"
import { Config } from "../config";

function CreateStudent() {
    const domain = Config();
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [selectedBirthday, setSelectedBirthday] = useState(new Date());
    const [selectedDayin, setSelectedDayin] = useState(new Date());
    const [selectedDayout, setSelectedDayout] = useState(null);
    
    const [classes, setClasses] = useState(null);
    const listClass = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${domain}/api/classes/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Form data sent successfully:', data);
                setClasses(data.data);
            } else {
                throw new Error('Error sending form data');
            }
        } catch (error) {
            console.error('Error:', error.message);
        } finally {
        }
        setLoading(false)
    };

    // chọn class dropdown
    const { register, handleSubmit, formState: { errors } } = useForm();


    const [formData, setFormData] = useState({
        sur_name: '',
        name: '',
        day_of_birth: selectedBirthday,
        grade: '6',
        class_id: 'A01',
        stay_in: false,
        gender: 'male',
        discount: '0',
        leave_school: false,
        parent_name: '',
        address: '',
        phone_number: '',
        day_in: selectedDayin,
        day_out: selectedDayout,
        fail_grade: false
    });
    

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value });
    };

    useEffect(() => {
        setFormData((prevData) => ({
            ...prevData,
            day_of_birth: selectedBirthday
        }));
    }, [selectedBirthday]);

    const onSubmit = async () => {
        setLoading(true);
        setIsSuccess(false);
        try {
            const response = await fetch(domain + '/api/students/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Form data sent successfully:', data);
                console.log('Form data sent successfully:', formData);
                setIsSuccess(true);
                
                // Reset form after successful submission
                window.scrollTo(0, 0);
                setTimeout(() => {
                    setIsSuccess(false);
                }, 5000);
            } else {
                throw new Error('Error sending form data');
            }
        } catch (error) {
            console.error('Error:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setFormData((prevData) => ({
            ...prevData,
            day_of_birth: selectedBirthday
        }));
    }, [selectedBirthday]);
    
    useEffect(() => {
        setFormData((prevData) => ({
            ...prevData,
            day_in: selectedDayin
        }));
    }, [selectedDayin]);
    
    useEffect(() => {
        setFormData((prevData) => ({
            ...prevData,
            day_out: selectedDayout
        }));
    }, [selectedDayout]);

    useEffect(() => {
        listClass()
    },[]);
    
    return (
        <div className="max-w-5xl mx-auto">
            {isSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center shadow-sm">
                    <img width="24" src={Success} alt="" className="mr-3" />
                    <span className="font-medium">Tạo mới học sinh thành công!</span>
                </div>
            )}
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-violet-800 to-violet-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">Thêm Mới Học Sinh</h2>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                    <div className="space-y-8">
                        {/* Thông tin cơ bản */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Thông tin cơ bản</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Họ và tên đệm <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                                        {...register('sur_name', { required: 'Vui lòng nhập họ và tên đệm' })}
                                        name="sur_name"
                                        placeholder="Nhập họ và tên đệm"
                                        type="text"
                                        onChange={handleInputChange}
                                    />
                                    {errors.sur_name && <p className="mt-1 text-sm text-red-600">{errors.sur_name.message}</p>}
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                                        {...register('name', { required: 'Vui lòng nhập tên' })}
                                        name="name"
                                        placeholder="Nhập tên"
                                        type="text"
                                        onChange={handleInputChange}
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày sinh
                                    </label>
                                    <DatePicker
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                                        selected={selectedBirthday}
                                        name="day_of_birth"
                                        onChange={(date) => setSelectedBirthday(date)}
                                        dateFormat="dd/MM/yyyy"
                                        value={format(selectedBirthday, "dd/MM/yyyy")}
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Giới tính
                                    </label>
                                    <select 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition appearance-none bg-white"
                                        defaultValue="male" 
                                        name="gender" 
                                        onChange={handleInputChange}
                                    >
                                        <option value="male">Nam</option>
                                        <option value="female">Nữ</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        {/* Thông tin học tập */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Thông tin học tập</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Khối
                                    </label>
                                    <select 
                                        defaultValue="6" 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition appearance-none bg-white" 
                                        name="grade" 
                                        onChange={handleInputChange}
                                    >
                                        {[6, 7, 8, 9, 10, 11, 12].map(grade => (
                                            <option key={grade} value={grade}>Khối {grade}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Lớp
                                    </label>
                                    <select 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition appearance-none bg-white" 
                                        name="class_id" 
                                        onChange={(event) => setFormData({ ...formData, class_id: event.target.value.replace(/[0-9]/g, "") })}
                                    >
                                        <option>{classes ? "Chọn lớp" : "Đang tải"}</option>
                                        {classes ? 
                                            classes.map((c, index) => <option key={index} value={c.name}>Lớp {c.name}</option>)
                                            : null
                                        }
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Miễn giảm học phí (%)
                                    </label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                                        {...register('discount', {
                                            required: 'Vui lòng nhập giảm học phí, nếu không giảm thì nhập 0',
                                            validate: value => (value >= 0 && value <= 100) || 'Giá trị phải nằm trong khoảng từ 0 đến 100'
                                        })}
                                        name="discount"
                                        placeholder="Nhập % giảm học phí"
                                        type="number"
                                        onChange={handleInputChange}
                                        defaultValue={0}
                                    />
                                    {errors.discount && <p className="mt-1 text-sm text-red-600">{errors.discount.message}</p>}
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày vào
                                    </label>
                                    <DatePicker
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                                        name="day_in"
                                        selected={selectedDayin}
                                        onChange={(date) => setSelectedDayin(date)}
                                        dateFormat="dd/MM/yyyy"
                                        value={format(selectedDayin, "dd/MM/yyyy")}
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày ra
                                    </label>
                                    <DatePicker
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                                        name="day_out"
                                        selected={selectedDayout}
                                        onChange={(date) => setSelectedDayout(date)}
                                        dateFormat="dd/MM/yyyy"
                                        value={selectedDayout ? format(selectedDayout, "dd/MM/yyyy") : ""}
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        placeholderText="Chọn ngày"
                                    />
                                </div>
                                
                                <div className="form-group flex items-center space-x-6">
                                    <div className="flex items-center">
                                        <input
                                            id="stay_in"
                                            className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                                            name="stay_in"
                                            type="checkbox"
                                            onChange={(event) => setFormData({ ...formData, stay_in: event.target.checked })}
                                        />
                                        <label htmlFor="stay_in" className="ml-2 text-sm font-medium text-gray-700">
                                            Nội trú
                                        </label>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        <input
                                            id="leave_school"
                                            className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                                            name="leave_school"
                                            type="checkbox"
                                            onChange={(event) => setFormData({ ...formData, leave_school: event.target.checked })}
                                        />
                                        <label htmlFor="leave_school" className="ml-2 text-sm font-medium text-gray-700">
                                            Nghỉ học
                                        </label>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        <input
                                            id="fail_grade"
                                            className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                                            name="fail_grade"
                                            type="checkbox"
                                            onChange={(event) => setFormData({ ...formData, fail_grade: event.target.checked })}
                                        />
                                        <label htmlFor="fail_grade" className="ml-2 text-sm font-medium text-gray-700">
                                            Lưu ban
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Thông tin liên hệ */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Thông tin liên hệ</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Họ tên phụ huynh <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                                        {...register('parent_name', { required: 'Vui lòng nhập tên phụ huynh' })}
                                        name="parent_name"
                                        placeholder="Nhập họ tên phụ huynh"
                                        type="text"
                                        onChange={handleInputChange}
                                    />
                                    {errors.parent_name && <p className="mt-1 text-sm text-red-600">{errors.parent_name.message}</p>}
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số điện thoại <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                                        {...register('phone_number')}
                                        name="phone_number"
                                        placeholder="Nhập số điện thoại"
                                        type="text"
                                        onChange={handleInputChange}
                                    />
                                    {errors.phone_number && <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>}
                                </div>
                                
                                <div className="form-group md:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Địa chỉ <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                                        {...register('address', { required: 'Vui lòng nhập địa chỉ' })}
                                        name="address"
                                        placeholder="Nhập địa chỉ"
                                        type="text"
                                        onChange={handleInputChange}
                                    />
                                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-5 border-t border-gray-200">
                        <div className="flex justify-center">
                            <button 
                                type="submit" 
                                className="px-6 py-3 bg-violet-800 text-white rounded-md hover:bg-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                                disabled={loading}
                            >
                                {loading ? <img width="24" src={Loading} alt="" className="mr-2" /> : null}
                                {loading ? 'Đang xử lý...' : 'Tạo mới học sinh'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
  
export default CreateStudent