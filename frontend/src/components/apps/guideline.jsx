
import banner from "../../assets/banner.webp";
import adddomain from "../../assets/add-domain-task.svg";
import getTranslation from "../i18n/guideline";

export function Guideline({lang}) {
  return (<>
    <div style={{height:"30px"}}></div>

    <div className='wp-bg-white wp-p-4 wp-rounded-lg wp-max-w-[1000px] wp-mx-auto'>
      <h3 className='wp-font-bold wp-text-2xl'>{getTranslation(lang,'guidelines')}</h3>
      <p className='wp-mb-3 wp-text-sm'>{getTranslation(lang,'g1')}</p>

      <div className='wp-bg-[#f3f3f3] wp-p-4 wp-rounded-xl'>
        <div className='wp-grid wp-grid-cols-1 md:wp-flex wp-gap-2'>
          <p className='wp-self-center wp-flex wp-full md:wp-w-2/3'>
            <svg className='wp-self-center wp-w-[60px]' width="20" height="20" viewBox="2 2 20 20" fill="white" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="black"></circle><path d="M17.2738 8.52629C17.6643 8.91682 17.6643 9.54998 17.2738 9.94051L11.4405 15.7738C11.05 16.1644 10.4168 16.1644 10.0263 15.7738L7.3596 13.1072C6.96908 12.7166 6.96908 12.0835 7.3596 11.693C7.75013 11.3024 8.38329 11.3024 8.77382 11.693L10.7334 13.6525L15.8596 8.52629C16.2501 8.13577 16.8833 8.13577 17.2738 8.52629Z"></path></svg>
            <div className="wp-grid wp-grid-cols-1">
              <span className='wp-px-2 wp-font-bold wp-text-lg'>{getTranslation(lang,'g2')}</span>
              <span className='wp-px-2 wp-text-sm'>{getTranslation(lang,'g3')}</span>
            </div>
          </p>
          <div className='wp-w-full md:wp-w-1/3'>
            <img className='wp-w-full md:wp-w-[150px] wp-mx-auto md:wp-ml-auto' src={banner} />
          </div>
        </div>
      </div>

      <div style={{height:"10px"}}></div>
      <p className='wp-text-sm'>{getTranslation(lang,'g4')}</p>
      <div style={{height:"10px"}}></div>

      <div className='wp-bg-[#f3f3f3] wp-p-4 wp-rounded-xl'>
        <div className='wp-grid wp-grid-cols-1 md:wp-flex wp-gap-2'>
          <p className='wp-self-center wp-flex wp-full md:wp-w-2/3'>
            <svg className='wp-self-center wp-w-[60px]' width="20" height="20" viewBox="2 2 20 20" fill="white" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="black"></circle><path d="M17.2738 8.52629C17.6643 8.91682 17.6643 9.54998 17.2738 9.94051L11.4405 15.7738C11.05 16.1644 10.4168 16.1644 10.0263 15.7738L7.3596 13.1072C6.96908 12.7166 6.96908 12.0835 7.3596 11.693C7.75013 11.3024 8.38329 11.3024 8.77382 11.693L10.7334 13.6525L15.8596 8.52629C16.2501 8.13577 16.8833 8.13577 17.2738 8.52629Z"></path></svg>
            <div className="wp-grid wp-grid-cols-1">
              <span className='wp-px-2 wp-font-bold wp-text-lg'>{getTranslation(lang,'g5')}</span>
              <span className='wp-px-2 wp-text-sm'>{getTranslation(lang,'g6')}</span>
            </div>
          </p>
          <div className='wp-w-full md:wp-w-1/3'>
            <img className='wp-w-full md:wp-w-[150px] wp-mx-auto md:wp-ml-auto' src={adddomain} />
          </div>
        </div>
      </div>

      <div style={{height:"10px"}}></div>
      <p className='wp-text-sm'>{getTranslation(lang,'g7')}</p>
      <div style={{height:"10px"}}></div>

    </div>

    </>);
}
