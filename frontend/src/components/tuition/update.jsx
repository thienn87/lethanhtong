import React from 'react';
function UpdateTuition() {

    return (
        <>
            <div className="grid gap-5 lg:gap-7.5">
                <div className="grid lg:grid-cols-1 gap-5 lg:gap-7.5 items-stretch">
                    <div className="card min-w-full">
                        <div className="card-header">
                            <h3 className="card-title">
                                Thêm mới nhóm học phí
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div class="p-4 flex gap-6">
                                <div class="input">
                                    <i class="ki-outline ki-magnifier"></i>
                                    <input placeholder="Mã nhóm học phí" type="text" value=""/>
                                </div>
                                {/* <button class="btn w-[100px] btn-light">Thêm mới</button> */}
                            </div>
                            
                            <div class="p-4 flex gap-6">
                                <div class="input">
                                    <i class="ki-outline ki-magnifier"></i>
                                    <input placeholder="Tên nhóm" type="text" value=""/>
                                </div>
                                {/* <button class="btn w-[100px] btn-light">Thêm mới</button> */}
                            </div>

                            <div class="p-4 flex gap-6">
                                <div class="input">
                                    <input placeholder="Số tiền mặc định" type="text" value=""/>
                                </div>
                                {/* <button class="btn w-[100px] btn-light">Thêm mới</button> */}
                            </div>

                            <div class="p-4 flex gap-6">
                                <div class="input">
                                    <input placeholder="Khối lớp" type="text" value=""/>
                                </div>
                            </div>

                        </div>
                        <div className="p-4 flex">
                            <button class="mx-auto btn w-[100px] btn-dark">Thêm mới</button>
                        </div>


                    </div>
                </div>
                

            </div>
        </>
    )
  }
  
  export default UpdateTuition
  