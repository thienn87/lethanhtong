import { useState } from 'react';
import {Toast} from "../polaris/toast";
import { Config } from "../config";
function AddClass() {

    const [grade,setgrade] = useState(null);
    const [name,setname] = useState(null);
    const [tuitionAmount,setTuitionAmount] = useState(null);
    const [loading, setLoading] = useState(false);
    const domain = Config();
    const submitCreateTuitionGroup = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${domain}/api/classes/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    grade: grade,
                    name: name,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Form data sent successfully:', data);
            } else {
                throw new Error('Error sending form data');
            }
        } catch (error) {
            console.error('Error:', error.message);
        } finally {
        }
        setLoading(false)
    };
    return (
        <>
            <div className="grid gap-5 lg:gap-7.5">
                <div className="grid lg:grid-cols-1 gap-5 lg:gap-7.5 items-stretch">
                    <div className="card min-w-full">
                        <div className="card-header">
                            <h3 className="card-title">
                                Thêm lớp mới
                            </h3>
                        </div>
                        <div className="card-body">
                        <div className="grid grid-cols-2 gap-2">
                            <div class="flex gap-6">
                                    <div class="w-full ">      
                                        <div class="relative">
                                            <select defaultValue={grade} onchange={(event) => setgrade(event.target.value)}
                                                class="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded pl-3 pr-8 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-400 shadow-sm focus:shadow-md appearance-none cursor-pointer">
                                                <option value="">Chọn khối</option>
                                                <option value="6">Khối 6</option>
                                                <option value="7">Khối 7</option>
                                                <option value="8">Khối 8</option>
                                                <option value="9">Khối 9</option>
                                                <option value="10">Khối 10</option>
                                                <option value="11">Khối 11</option>
                                                <option value="12">Khối 12</option>
                                            </select>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor" class="h-5 w-5 ml-1 absolute top-2.5 right-2.5 text-slate-700">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="flex gap-6">
                                    <div class="input">
                                        <i class="ki-outline ki-magnifier"></i>
                                        <input placeholder="Tên lớp vd : A" type="text" defaultValue={name} onBlur={(event) => setname(event.target.value)}/>
                                    </div>
                                </div>

                            </div>
                        </div>
                        
                        <div className="p-4 flex">
                            <div onClick={ () => submitCreateTuitionGroup()} class="mx-auto btn btn-primary flex justify-center">Thêm mới</div>
                        </div>


                    </div>
                </div>
                

            </div>
            <Toast status={loading}>Đang tải</Toast>
        </>
    )
  }
  
  export default AddClass
  