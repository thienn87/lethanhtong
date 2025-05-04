import getTranslation from "../../i18n/guideline";
import rocket from "../../assets/rocket.svg";
import adddomain from "../../assets/add-domain-task.svg";

export function Guideline({lang}) {
  return (<>
    <div style={{height:"30px"}}></div>

    <div className='ttw-bg-white ttw-p-4 ttw-rounded-xl ttw-max-w-[1000px] ttw-mx-auto'>
      <h3 className='ttw-font-bold ttw-text-xl'>Translate guide</h3>
      <p className='ttw-mb-3'>Use this personalized guide to get your store up and running.</p>

      <div className='ttw-bg-[#f3f3f3] ttw-p-4 ttw-rounded-xl'>
        <div className='ttw-flex ttw-gap-2'>
          <p className='ttw-self-center ttw-flex ttw-w-2/3'>
            <svg className='ttw-self-center ttw-w-[60px]' width="20" height="20" viewBox="2 2 20 20" fill="white" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="black"></circle><path d="M17.2738 8.52629C17.6643 8.91682 17.6643 9.54998 17.2738 9.94051L11.4405 15.7738C11.05 16.1644 10.4168 16.1644 10.0263 15.7738L7.3596 13.1072C6.96908 12.7166 6.96908 12.0835 7.3596 11.693C7.75013 11.3024 8.38329 11.3024 8.77382 11.693L10.7334 13.6525L15.8596 8.52629C16.2501 8.13577 16.8833 8.13577 17.2738 8.52629Z"></path></svg>
            <div className="ttw-grid ttw-grid-cols-1">
              <span className='ttw-px-2 ttw-font-bold'>Use apps to design a homepage</span>
              <span className='ttw-px-2'>Use apps to design a homepage that grabs attention, engages visitors, and drives more sales while helping your business stand out.</span>
            </div>
          </p>
          <div className='ttw-w-1/3'>
            <img className='ttw-w-25 ttw-ml-auto' src={adddomain} />
          </div>
        </div>
      </div>

      <div style={{height:"20px"}}></div>

      <div className='ttw-bg-[#f3f3f3] ttw-p-4 ttw-rounded-xl'>
        <div className='ttw-flex ttw-gap-2'>
          <p className='ttw-self-center ttw-flex ttw-w-2/3'>
            <svg className='ttw-self-center ttw-w-[60px]' width="20" height="20" viewBox="2 2 20 20" fill="white" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="black"></circle><path d="M17.2738 8.52629C17.6643 8.91682 17.6643 9.54998 17.2738 9.94051L11.4405 15.7738C11.05 16.1644 10.4168 16.1644 10.0263 15.7738L7.3596 13.1072C6.96908 12.7166 6.96908 12.0835 7.3596 11.693C7.75013 11.3024 8.38329 11.3024 8.77382 11.693L10.7334 13.6525L15.8596 8.52629C16.2501 8.13577 16.8833 8.13577 17.2738 8.52629Z"></path></svg>
            <div className="ttw-grid ttw-grid-cols-1">
              <span className='ttw-px-2 ttw-font-bold'>Use apps to design a homepage</span>
              <span className='ttw-px-2'>Use apps to design a homepage that grabs attention, engages visitors, and drives more sales while helping your business stand out.</span>
            </div>
          </p>
          <div className='ttw-w-1/3'>
            <img className='ttw-w-25 ttw-ml-auto' src={rocket} />
          </div>
        </div>
      </div>

      <div style={{height:"20px"}}></div>

      <p className=''>Use apps to design a homepage that grabs attention, engages visitors, and drives more sales while helping your business stand out.</p>

    </div>

    <div style={{height:"30px"}}></div>
    </>);
}
