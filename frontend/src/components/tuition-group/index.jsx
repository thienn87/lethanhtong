import { useEffect, useState } from 'react';
import {ItemList} from "./index_itemList.jsx";
import {Toast} from "../polaris/toast";
import { Config } from "../config";
function ListGroupTuition() {
    const [tuitionGroup,setTuitionGroup] = useState(null);
    const [loading,setLoading] = useState(false)
    const domain = Config();
    const listTuitionGroup = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${domain}/api/tuitions/group/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Form data sent successfully:', data);
                setTuitionGroup(data.data);
            } else {
                throw new Error('Error sending form data');
            }
        } catch (error) {
            console.error('Error:', error.message);
        } finally {
        }
        setLoading(false)
    };
    const [refetch,setRefetch] = useState(false);

    useEffect( () => {
        listTuitionGroup()
    },[refetch]);
    const handleRefetch = (value) => {
        setRefetch(!refetch)
    }
    const [modal,setModal] = useState(null);

    return (
        <>
            <ItemList reFetch={(value) => handleRefetch(value)} listTuitionGroup={listTuitionGroup} items={tuitionGroup} click={(e) => {
                setModal({
                    code: tuitionGroup[e].code,
                    name: tuitionGroup[e].name,
                    default_amount: tuitionGroup[e].default_amount,
                });
            }}/>
            <Toast status={loading}>Đang tải</Toast>
        </>
    )
  }
  
  export default ListGroupTuition
  