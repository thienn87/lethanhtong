import { Button } from "../polaris/button";
import { Spinner } from "../polaris/spinner";

export function ItemList({items,click,buttonName,next,prev}) {
  if (!items) {
    return <div style={{width:"20px",margin:"auto"}}><Spinner/></div>
  } else {
    console.warn("Data type ItemList : ", items)
  }
  const handleSingleClick = (value) => {
    click(value)
  }
  const handleNext = () => {
    next(true)
  }
  const handlePrev = () => {
    prev(true)
  }
  return (<>

  {items.map((item, index) => (
    <>
    <div className="card p-5 lg:p-7.5 mb-3">
    <div className="flex items-center flex-wrap justify-between gap-5">
      <div className="flex items-center gap-3.5">
        <div className="flex items-center justify-center w-[50px]">
          <img
            alt=""
            className="size-[50px] shrink-0 rounded-full border border-2"
            src="https://maydongphucbinhduong.vn/hoanghung/5/images/5(12).jpg"
          />
        </div>
        <div>
          <a className="text-lg font-medium text-gray-900 hover:text-primary font-bold" href="">
          Người nộp
          </a>
          <div className="flex items-center text-sm text-gray-700">{item.student}</div>
        </div>
      </div>

      <div className="flex items-center flex-wrap justify-between gap-5 lg:gap-12">
        <div className="flex items-center flex-wrap gap-2 lg:gap-5">
          <div className="flex flex-col gap-1.5 border border-dashed border-gray-300 rounded-md px-2.5 py-2">
            <span className="text-gray-900 text-sm leading-none font-medium">+{item.amount_paid} vnd</span>
            <span className="text-gray-700 text-xs">{item.tuition_group}</span>
          </div>
          <div className="flex flex-col gap-1.5 border border-dashed border-gray-300 rounded-md px-2.5 py-2">
            <span className="text-gray-900 text-sm leading-none font-medium">Ghi chú</span>
            <span className="text-gray-700 text-xs">{item.note}</span>
          </div>
          
        </div>
        
        <div className="flex justify-center w-20">
          <span className="badge badge-primary badge-outline cursor-pointer">{item.created_at}</span>
        </div>

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
            <div className="menu-dropdown menu-default w-full max-w-[200px]" data-menu-dismiss="true">
              <div className="menu-item">
                <a className="menu-link" href="html/demo1/account/home/settings-enterprise.html">
                  <span className="menu-icon">
                    <i className="ki-filled ki-setting-3"></i>
                  </span>
                  <span className="menu-title">Sửa giao dịch</span>
                </a>
              </div>
              <div className="menu-item">
                <a className="menu-link" href="html/demo1/account/members/import-members.html">
                  <span className="menu-icon">
                    <i className="ki-filled ki-some-files"></i>
                  </span>
                  <span className="menu-title">Xoá giao dịch</span>
                </a>
              </div>
              {/* <div className="menu-item">
                <a className="menu-link" href="html/demo1/account/activity.html">
                  <span className="menu-icon">
                    <i className="ki-filled ki-cloud-change"></i>
                  </span>
                  <span className="menu-title">Chỉnh sửa</span>
                </a>
              </div>
              <div className="menu-item">
                <a className="menu-link" data-modal-toggle="#report_user_modal" href="#">
                  <span className="menu-icon">
                    <i className="ki-filled ki-dislike"></i>
                  </span>
                  <span className="menu-title">Xoá học sinh</span>
                </a>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
      </>
  ))}


    <div style={{float:"right",display:"flex",margin:"10px"}}>
      <div onClick={() => handlePrev()} style={{
        padding:"4px",
        width:"30px",
        backgroundColor:"white",
        borderRadius:"8px",
        marginRight:"4px",
        borderTop:"solid 1px #f1f1f1",
        borderLeft:"solid 1px #f1f1f1",
        borderRight:"solid 1px #f1f1f1",
        borderBottom:"solid 1px #d6d6d6",
        cursor:"pointer"
        }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.75 5.75a.75.75 0 0 0-1.5 0v8.5a.75.75 0 0 0 1.5 0v-8.5Zm7.796.514a.75.75 0 1 0-1.092-1.028l-4 4.25a.75.75 0 0 0 0 1.028l4 4.25a.75.75 0 1 0 1.092-1.028l-3.516-3.736 3.516-3.736Z"/></svg>
      </div>
      <div onClick={() => handleNext()} style={{
        padding:"4px",
        width:"30px",
        backgroundColor:"white",
        borderRadius:"8px",
        borderTop:"solid 1px #f1f1f1",
        borderLeft:"solid 1px #f1f1f1",
        borderRight:"solid 1px #f1f1f1",
        borderBottom:"solid 1px #d6d6d6",
        cursor:"pointer"
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.454 13.736a.75.75 0 1 0 1.092 1.028l4-4.25a.75.75 0 0 0 0-1.028l-4-4.25a.75.75 0 1 0-1.092 1.028l3.516 3.736-3.516 3.736Zm9.296-7.986a.75.75 0 0 0-1.5 0v8.5a.75.75 0 0 0 1.5 0v-8.5Z"/></svg>
      </div>
    </div>

    <div style={{clear:"both"}}></div>
    
    </>);
}