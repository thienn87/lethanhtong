import { useState } from 'react';
import {Toast} from "../polaris/toast";
import { Config } from "../config";
function AddGrade() {
    const domain = Config();
    const [loading, setLoading] = useState(false);
    const [tuitionCode,setTuitionCode] = useState(null);    
    const [tuitionName,setTuitionName] = useState(null);
    const submitCreateTuitionGroup = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${domain}/api/grades/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    grade: tuitionCode,
                    name: tuitionName
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
                                Thêm mới khối 
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div class="p-4 flex gap-6">
                                <div class="input">
                                    <i class="ki-outline ki-magnifier"></i>
                                    <input placeholder="Tên khối vd : 10" type="text" defaultValue={tuitionCode} onBlur={(event) => setTuitionCode(event.target.value)}/>
                                </div>
                            </div>
                            
                            <div class="p-4 flex gap-6">
                                <div class="input">
                                    <i class="ki-outline ki-magnifier"></i>
                                    <input placeholder="Mã khối vd : 10" type="text" defaultValue={tuitionName} onBlur={(event) => setTuitionName(event.target.value)}/>
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
  
  export default AddGrade
  