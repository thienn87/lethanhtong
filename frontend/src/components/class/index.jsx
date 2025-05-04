import React, { useEffect, useState } from 'react';
import { format } from "date-fns";
import {ItemList} from "./index_itemList";
import {Toast} from "../polaris/toast";
import { Config } from "../config";
function ListClass() {
    const [classes,setClasses] = useState(null);
    const [loading, setLoading] = useState(false);
    const domain = Config();
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
    useEffect( () => {
        listClass()
    },[]);
    return (
        <>
            <div className="grid gap-5 lg:gap-7.5">
                <div className="grid lg:grid-cols-1 gap-5 lg:gap-7.5 items-stretch">
                    <div className="card min-w-full">
                        <div className="card-header">
                            <h3 className="card-title">
                                Danh sách các lớp
                            </h3>
                        </div>
                    </div>
                    
                </div>
            </div>
        <div style={{height:"20px"}}></div>
        
        <ItemList items={classes} buttonName="Chi tiết"/>

        <Toast status={loading}>Đang tải</Toast>
        </>
    )
  }
  
  export default ListClass
  