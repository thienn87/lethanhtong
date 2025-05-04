import { Spinner } from "../polaris/spinner";
import { format } from "date-fns";
import { Card, Typography } from "@material-tailwind/react";

export function ItemList({items,click,click2,next,prev}) {
  if (!items) {
    return <div style={{width:"20px",margin:"auto"}}><Spinner/></div>
  } else {
    // console.warn('Debug index_itemList.jsx ',items)
  }
  const handlePopupDetail = (value) => {
    click(value)
  }
  const handleTransactionDetail = (value) => {
    click2(value)
  }
  const handleNext = () => {
    next(true)
  }
  const handlePrev = () => {
    prev(true)
  }
  const handleDropdownMenu = (index) => {
    const dropdown = document.getElementById("menu-dropdown-" + index);
    
    if (dropdown.classList.contains("hidden")) {
        dropdown.classList.remove("hidden");
        dropdown.classList.add("block");
    } else {
        dropdown.classList.remove("block");
        dropdown.classList.add("hidden");
    }
  }

  const TABLE_HEAD = ["MSHS", "Họ", "Tên", "Ngày sinh", "Lớp", "Thu HP"];
  const TABLE_ROWS = items;

  return (

    <>asd
    <div className="grid">
    <h3 className="my-3 font-bold">Danh sách học sinh</h3>
  </div>
  <Card className="h-full w-full overflow-hidden">
      <table className="w-full min-w-max table-auto text-left">
        <thead>
          <tr>
            {TABLE_HEAD.map((head) => (
              <th
                key={head}
                className="border-b border-gray-900 bg-gray-50 p-4"
              >
                <Typography
                  variant="small"
                  color="text-gray-800"
                  className=" text-gray-800 font-bold"
                >
                  {head}
                </Typography>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TABLE_ROWS.map((item,index) => {
            const isLast = index === TABLE_ROWS.length - 1;
            const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-300";
            return (
              <tr key={item.mshs}   className="even:bg-gray-100">
                <td className={classes}>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal"
                  >
                    {item.mshs}
                  </Typography>
                </td>
                <td className={classes}>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal"
                  >
                    {item.sur_name}
                  </Typography>
                </td>
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
                   {format(new Date(item.day_of_birth), "dd/MM/yyyy")}
                  </Typography>
                </td>
                <td className={classes}>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal"
                  >
                    {item.grade}{item.class}
                  </Typography>
                </td>
                <td className={classes}>
                  <a className="btn btn-sm btn-icon btn-clear btn-light" href="#">
                      <div className="btn btn-sm btn-icon btn-clear btn-light" onClick={ async () => handleTransactionDetail(index)}>
                      <svg className="w-[18px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M8.575 4.649c.707-.734 1.682-1.149 2.7-1.149h1.975c1.795 0 3.25 1.455 3.25 3.25v1.5c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-1.5c0-.966-.784-1.75-1.75-1.75h-1.974c-.611 0-1.197.249-1.62.69l-4.254 4.417c-.473.49-.466 1.269.016 1.75l2.898 2.898c.385.386 1.008.392 1.4.014l.451-.434c.299-.288.773-.279 1.06.02.288.298.28.773-.02 1.06l-.45.434c-.981.945-2.538.93-3.502-.033l-2.898-2.898c-1.06-1.06-1.075-2.772-.036-3.852l4.254-4.417Z"/><path d="M14 7c0 .552-.448 1-1 1s-1-.448-1-1 .448-1 1-1 1 .448 1 1Z"/><path d="M13.25 10.857c-.728.257-1.25.952-1.25 1.768 0 1.036.84 1.875 1.875 1.875h.75c.207 0 .375.168.375.375s-.168.375-.375.375h-1.875c-.414 0-.75.336-.75.75s.336.75.75.75h.5v.25c0 .414.336.75.75.75s.75-.336.75-.75v-.254c.977-.064 1.75-.877 1.75-1.871 0-1.036-.84-1.875-1.875-1.875h-.75c-.207 0-.375-.168-.375-.375s.168-.375.375-.375h1.875c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-1v-.25c0-.414-.336-.75-.75-.75s-.75.336-.75.75v.357Z"/></svg>
                    </div>
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
    </>
//   <div>  
// <div class="grid">
//  <div class="card card-grid min-w-full">
//   <div class="card-header py-5 flex-wrap">
//    <h3 class="card-title">
//     Danh sách công nợ
//    </h3>
//    <label class="switch switch-sm">
//     <input checked="" class="order-2" name="check" type="checkbox" value="1"/>
//     <span class="switch-label order-1">
//      Push Alerts
//     </span>
//    </label>
//   </div>
//   <div class="card-body">
//    <div data-datatable="true" data-datatable-page-size="5" data-datatable-state-save="true" id="datatable_1">
//     <div class="scrollable-x-auto">
//      <table class="table table-auto table-border" data-datatable-table="true">
//       <thead>
//        <tr>
//         <th class="w-[100px] text-center">
//          <span class="sort asc">
//           <span class="sort-label">
//            Status
//           </span>
//           <span class="sort-icon">
//           </span>
//          </span>
//         </th>
//         <th class="min-w-[185px]">
//          <span class="sort">
//           <span class="sort-label">
//            Học sinh
//           </span>
//           <span class="sort-icon">
//           </span>
//          </span>
//         </th>
//         <th class="w-[185px]">
//          <span class="sort">
//           <span class="sort-label">
//            Lớp
//           </span>
//           <span class="sort-icon">
//           </span>
//          </span>
//         </th>
//         <th class="w-[185px]">
//          <span class="sort">
//           <span class="sort-label">
//            <span class="pt-px" data-tooltip="true" data-tooltip-offset="0, 5px" data-tooltip-placement="top">
//             <i class="ki-outline ki-information-2 text-lg leading-none">
//             </i>
//             <span class="tooltip max-w-48" data-tooltip-content="true">
//              Merchant account providers
//             </span>
//            </span>
//            Ngày sinh
//            {/* Ngày sinh bg-success bg-warning bg-danger */}
//           </span>
//           <span class="sort-icon">
//           </span>
//          </span>
//         </th>
//         <th class="w-[60px]">
//         </th>
//         <th class="w-[60px]">
//         </th>
//        </tr>
//       </thead>
//       <tbody>
//       {items.map((item,index) => (
//         <tr>
//         <td class="text-center">
//          <span class="badge badge-dot size-2 bg-success">
//          </span>
//         </td>
//         <td>
//         {item.sur_name} {item.name}
//         </td>
//         <td>
//         {item.grade}{item.class}
//         </td>
//         <td>
//         {item.day_of_birth}
//         </td>
//         <td>
//          <div class="btn btn-sm btn-icon btn-clear btn-light" onClick={ async () => handleTransactionDetail(index)}>
//           <i class="ki-outline ki-notepad-edit">
//           </i>
//          </div>
//         </td>
//        </tr>
//       ))}

//       </tbody>
//      </table>
//     </div>
//     <div class="card-footer justify-center md:justify-between flex-col md:flex-row gap-3 text-gray-600 text-2sm font-medium">
//      <div class="flex items-center gap-2">
//       Xem trang
//       <select class="select select-sm w-16" data-datatable-size="true" name="perpage">
//         <option> 1</option>
//         <option> 2</option>
//         <option> 3</option>
//         <option> 4</option>
//       </select>
//       {/* per page */}

//       <div style={{float:"right",display:"flex",margin:"10px"}}>
//       <div onClick={() => handlePrev()} style={{
//         padding:"4px",
//         width:"30px",
//         backgroundColor:"white",
//         borderRadius:"8px",
//         marginRight:"4px",
//         borderTop:"solid 1px #f1f1f1",
//         borderLeft:"solid 1px #f1f1f1",
//         borderRight:"solid 1px #f1f1f1",
//         borderBottom:"solid 1px #d6d6d6",
//         cursor:"pointer"
//         }}>
//         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.75 5.75a.75.75 0 0 0-1.5 0v8.5a.75.75 0 0 0 1.5 0v-8.5Zm7.796.514a.75.75 0 1 0-1.092-1.028l-4 4.25a.75.75 0 0 0 0 1.028l4 4.25a.75.75 0 1 0 1.092-1.028l-3.516-3.736 3.516-3.736Z"/></svg>
//       </div>
//       <div onClick={() => handleNext()} style={{
//         padding:"4px",
//         width:"30px",
//         backgroundColor:"white",
//         borderRadius:"8px",
//         borderTop:"solid 1px #f1f1f1",
//         borderLeft:"solid 1px #f1f1f1",
//         borderRight:"solid 1px #f1f1f1",
//         borderBottom:"solid 1px #d6d6d6",
//         cursor:"pointer"
//       }}>
//         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.454 13.736a.75.75 0 1 0 1.092 1.028l4-4.25a.75.75 0 0 0 0-1.028l-4-4.25a.75.75 0 1 0-1.092 1.028l3.516 3.736-3.516 3.736Zm9.296-7.986a.75.75 0 0 0-1.5 0v8.5a.75.75 0 0 0 1.5 0v-8.5Z"/></svg>
//       </div>
//     </div>

//     <div style={{clear:"both"}}></div>
    
//      </div>
//      <div class="flex items-center gap-4">
//       <span data-datatable-info="true">
//       </span>
//       <div class="pagination" data-datatable-pagination="true">
//       </div>
//      </div>
//     </div>
//    </div>
//   </div>
//  </div>
// </div>

//     </div>
    );
}