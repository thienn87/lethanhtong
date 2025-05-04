import { useEffect, useState } from 'react';
import {Spinner} from "../polaris/spinner";
import { Config } from "../config";
function Tuition() {
    const [classes,setClasses] = useState(null);
    const [classesFilter,setClassesFilter] = useState(null);
    const domain = Config();
    useEffect(() => {
        const filtered = classes ? classes.map(({ grade,name, tuition_group_ids }) => ({
          grade,
          name,
          tuition_group_ids
        })) : null ;
        setClassesFilter(filtered);
      }, [classes]);

      const listClass = async () => {
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
    };
    useEffect( () => {
        listClass()
    },[]);
    return (
        <>
    <div className="grid grid-cols-2 gap-6">
    {
    classesFilter !== null ? classesFilter.map((item,index) => <>
    <div className="card h-full">
      <div className="card-header">
        <h3 className="card-title">Lớp {item.name}</h3>
        <div className="menu" data-menu="true">
          <div
            className="menu-item menu-item-dropdown"
            data-menu-item-offset="0, 10px"
            data-menu-item-placement="bottom-end"
            data-menu-item-toggle="dropdown"
            data-menu-item-trigger="click|lg:click"
          >
            <button className="menu-toggle btn btn-sm btn-icon btn-light btn-clear">
              <i className="ki-filled ki-dots-vertical"></i>
            </button>
            <div
              className="menu-dropdown menu-default w-full max-w-[200px]"
              data-menu-dismiss="true"
            >
              <div className="menu-item">
                <a className="menu-link" href="html/demo10/account/activity.html">
                  <span className="menu-icon">
                    <i className="ki-filled ki-cloud-change"></i>
                  </span>
                  <span className="menu-title">Activity</span>
                </a>
              </div>
              <div className="menu-item">
                <a className="menu-link" data-modal-toggle="#share_profile_modal" href="#">
                  <span className="menu-icon">
                    <i className="ki-filled ki-share"></i>
                  </span>
                  <span className="menu-title">Share</span>
                </a>
              </div>
              <div
                className="menu-item menu-item-dropdown"
                data-menu-item-offset="-15px, 0"
                data-menu-item-placement="right-start"
                data-menu-item-toggle="dropdown"
                data-menu-item-trigger="click|lg:hover"
              >
                <div className="menu-link">
                  <span className="menu-icon">
                    <i className="ki-filled ki-notification-status"></i>
                  </span>
                  <span className="menu-title">Notifications</span>
                  <span className="menu-arrow">
                    <i className="ki-filled ki-right text-3xs"></i>
                  </span>
                </div>
                <div className="menu-dropdown menu-default w-full max-w-[175px]">
                  <div className="menu-item">
                    <a className="menu-link" href="html/demo10/account/home/settings-sidebar.html">
                      <span className="menu-icon">
                        <i className="ki-filled ki-sms"></i>
                      </span>
                      <span className="menu-title">Email</span>
                    </a>
                  </div>
                  <div className="menu-item">
                    <a className="menu-link" href="html/demo10/account/home/settings-sidebar.html">
                      <span className="menu-icon">
                        <i className="ki-filled ki-message-notify"></i>
                      </span>
                      <span className="menu-title">SMS</span>
                    </a>
                  </div>
                  <div className="menu-item">
                    <a className="menu-link" href="html/demo10/account/home/settings-sidebar.html">
                      <span className="menu-icon">
                        <i className="ki-filled ki-notification-status"></i>
                      </span>
                      <span className="menu-title">Push</span>
                    </a>
                  </div>
                </div>
              </div>
              <div className="menu-item">
                <a className="menu-link" data-modal-toggle="#report_user_modal" href="#">
                  <span className="menu-icon">
                    <i className="ki-filled ki-dislike"></i>
                  </span>
                  <span className="menu-title">Report</span>
                </a>
              </div>
              <div className="menu-separator"></div>
              <div className="menu-item">
                <a className="menu-link" href="html/demo10/account/home/settings-enterprise.html">
                  <span className="menu-icon">
                    <i className="ki-filled ki-setting-3"></i>
                  </span>
                  <span className="menu-title">Settings</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-body flex flex-col gap-4 p-5 lg:p-7.5 lg:pt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-normal text-gray-700">Các khoản giao dich</span>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl font-semibold text-gray-900">$295.7k</span>
            { item.tuition_group_ids ?
            item.tuition_group_ids.map((tuition, index) => (
  <span key={index} className="badge badge-outline badge-success badge-sm">
    {tuition.name}
  </span>
))
: null 
}

            
          </div>
        </div>

        <div className="flex items-center gap-1 mb-1.5">
          <div className="bg-success h-2 w-full max-w-[60%] rounded-sm"></div>
          <div className="bg-brand h-2 w-full max-w-[25%] rounded-sm"></div>
          <div className="bg-info h-2 w-full max-w-[15%] rounded-sm"></div>
        </div>

        <div className="flex items-center flex-wrap gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="badge badge-dot size-2 badge-success"></span>
            <span className="text-sm font-normal text-gray-800">Đã thu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="badge badge-dot size-2 badge-danger"></span>
            <span className="text-sm font-normal text-gray-800">Đang thu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="badge badge-dot size-2 badge-info"></span>
            <span className="text-sm font-normal text-gray-800">Phát sinh</span>
          </div>
        </div>

        <div className="border-b border-gray-300"></div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <i className="ki-filled ki-shop text-base text-gray-500"></i>
              <span className="text-sm font-normal text-gray-900">Học phí</span>
            </div>
            <div className="flex items-center text-sm font-medium text-gray-800 gap-6">
              <span className="lg:text-right">$172k</span>
              <span className="lg:text-right">
                <i className="ki-filled ki-arrow-up text-success"></i>
                3.9%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <i className="ki-filled ki-instagram text-base text-gray-500"></i>
              <span className="text-sm font-normal text-gray-900">Gây quỹ</span>
            </div>
            <div className="flex items-center text-sm font-medium text-gray-800 gap-6">
              <span className="lg:text-right">$36k</span>
              <span className="lg:text-right">
                <i className="ki-filled ki-arrow-up text-success"></i>
                8.2%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <i className="ki-filled ki-shop text-base text-gray-500"></i>
              <span className="text-sm font-normal text-gray-900">Phát sinh</span>
            </div>
            <div className="flex items-center text-sm font-medium text-gray-800 gap-6">
              <span className="lg:text-right">$50k</span>
              <span className="lg:text-right">
                <i className="ki-filled ki-arrow-up text-success"></i>
                4.8%
              </span>
            </div>
          </div>

          <div class="card-footer justify-between items-center py-3.5">
           <a class="btn btn-light btn-sm">
            <i class="ki-filled ki-mouse-square">
            </i>
            Thu học phí
           </a>
           <div class="flex items-center gap-2.5">
            <div class="switch switch-sm">
             <input name="param" type="checkbox" value="1"/>
            </div>
           </div>
          </div>

        </div>
      </div>
    </div>

    </>
    ) : <Spinner/> }

    </div>
        </>
    )
  }
  
  export default Tuition
  