export function BreadCrumb({clickHome, clickList, showSingle}) {
  const handleClickHome = () => {
    clickHome(null)
  }
  const handleClickList = () => {
    clickList(true)
  }
  return (<>
  <div className={ showSingle === true ? "wp-w-[1000px]" : "wp-w-full" }>
    <ol className="wp-flex wp-items-center wp-w-full wp-text-sm wp-font-medium wp-text-center">
        <li onClick={handleClickHome} className="wp-cursor-pointer wp-flex md:wp-w-full wp-items-center after:wp-w-full after:wp-h-1 after:wp-border-b after:wp-border-gray-200 after:wp-border-1 after:wp-hidden sm:after:wp-inline-block after:wp-mx-6 xl:after:wp-mx-10 dark:after:wp-border-gray-700">
          <svg className="wp-self-center wp-w-[30px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.344 3.692a2.25 2.25 0 0 1 3.312 0l3.854 4.19a3.75 3.75 0 0 1 .99 2.538v3.33a2.75 2.75 0 0 1-2.75 2.75h-1.75a1.5 1.5 0 0 1-1.5-1.5v-2h-1v2a1.5 1.5 0 0 1-1.5 1.5h-1.75a2.75 2.75 0 0 1-2.75-2.75v-3.33c0-.94.353-1.847.99-2.539l3.854-4.189Zm2.208 1.016a.75.75 0 0 0-1.104 0l-3.854 4.189a2.25 2.25 0 0 0-.594 1.523v3.33c0 .69.56 1.25 1.25 1.25h1.75v-2a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v2h1.75c.69 0 1.25-.56 1.25-1.25v-3.33a2.25 2.25 0 0 0-.594-1.523l-3.854-4.19Z"/></svg>
          
        </li>

        { showSingle === true ?
        <li onClick={handleClickList} className="wp-cursor-pointer wp-flex md:wp-w-full wp-items-center after:wp-w-full after:wp-h-1 after:wp-border-b after:wp-border-gray-200 after:wp-border-1 after:wp-hidden sm:after:wp-inline-block after:wp-mx-6 xl:after:wp-mx-10 dark:after:wp-border-gray-700">
          <svg className="wp-self-center wp-w-[30px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 5a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1-.75-.75Zm0 5a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1-.75-.75Zm0 5a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1-.75-.75Z"/><path d="m3.75 3.38-.2.15a.5.5 0 1 1-.6-.8l.6-.45a.75.75 0 0 1 1.2.6v3h.5a.5.5 0 0 1 0 1h-2a.5.5 0 1 1 0-1h.5v-2.5Zm-1 5.87a1.5 1.5 0 1 1 3 0v.05a1.5 1.5 0 0 1-.503 1.122l-.932.828h.935a.5.5 0 0 1 0 1h-1.592c-.69 0-1.014-.852-.499-1.31l1.423-1.265a.5.5 0 0 0 .168-.375v-.05a.5.5 0 0 0-1 0 .5.5 0 0 1-1 0Zm.5 3.88a.5.5 0 0 0 0 1h1.188a.32.32 0 0 1 .312.32.506.506 0 0 1-.24.43h-.76a.5.5 0 0 0 0 1h.76c.145.088.24.252.24.43a.32.32 0 0 1-.312.32h-1.188a.5.5 0 0 0 0 1h1.188a1.32 1.32 0 0 0 1.312-1.32 1.51 1.51 0 0 0-.321-.93 1.51 1.51 0 0 0 .321-.93 1.32 1.32 0 0 0-1.312-1.32h-1.188Z"/></svg>
        </li> : null }

        <li className="wp-flex wp-md:w-full wp-items-center">
          <svg className="wp-self-center wp-w-[30px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fillRule="evenodd" d="M15.78 5.97a.75.75 0 0 1 0 1.06l-6.5 6.5a.75.75 0 0 1-1.06 0l-3.25-3.25a.75.75 0 1 1 1.06-1.06l2.72 2.72 5.97-5.97a.75.75 0 0 1 1.06 0Z"/></svg>
          <span className="">
              Current
          </span>
        </li>
    </ol>
    </div>
    </>);
}
