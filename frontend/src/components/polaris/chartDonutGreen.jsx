import { useEffect, useRef, useState } from 'react';

export function ChartDonutGreen() {
  
  return (
    <>
    <div className="wp-w-full wp-max-w-[300px] wp-p-1 wp-flex wp-rounded-[15px] wp-relative wp-mx-auto">
      <svg className="rc-progress-circle" viewBox="-50 -50 100 100" role="presentation"><circle className="rc-progress-circle-trail" r="46.5" cx="0" cy="0" stroke="#D9D9D9" strokeLinecap="round" strokeWidth="3" 
        style={{
          stroke: "rgb(217, 217, 217)",
          strokeDasharray: "292.168px, 292.168",
          strokeDashoffset: 0,
          transform: "rotate(-90deg)",
          transformOrigin: "0px 0px",
          transition: "stroke-dashoffset 0.3s, stroke-dasharray 0.3s, stroke 0.3s, stroke-width 0.06s 0.3s, opacity 0.3s",
          fillOpacity: 0
        }}                    
        ></circle><circle className="rc-progress-circle-path" r="46.5" cx="0" cy="0" strokeLinecap="round" strokeWidth="7" opacity="1" 
        style={{
          stroke: "rgb(0, 122, 92)",
          strokeDasharray: "292.168px, 292.168",
          strokeDashoffset: "29.7951",
          transform: "rotate(-90deg)",
          transformOrigin: "0px 0px",
          transition: "stroke-dashoffset, stroke-dasharray, stroke, stroke-width 0.3s, opacity",
          fillOpacity: 0
        }}                    
        ></circle></svg>
        <h3 className="wp-absolute wp-top-50 wp-text-4xl wp-text-center wp-font-bold wp-w-full wp-text-[#007a5c]" style={{top:"calc(50% - 1.5rem)"}}>
          99%
        </h3>
    </div>
    </>
  );
}
