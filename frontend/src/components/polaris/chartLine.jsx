export function ChartLine({ chartNumbers }) {
  
  if( !chartNumbers ){
    const svgContent = `
    <svg viewBox="0 0 700 130" xmlns="http://www.w3.org/2000/svg" width="772" height="130" class="_SVG_11yon_154" role="table"><line x2="723.3" stroke="#eeeeef" transform="translate(44.7,100)"></line><line x2="723.3" stroke="#eeeeef" transform="translate(44.7,52.5)"></line><line x2="723.3" stroke="#eeeeef" transform="translate(44.7,5)"></line><g transform="translate(44.7,5)" style="
"><g opacity="1"><defs><linearGradient id="line-line-series-141" x1="0%" x2="0%" y1="100%" y2="0%" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#0A97D5" stop-opacity="1"></stop><stop offset="100%" stop-color="#50C3F7" stop-opacity="1"></stop></linearGradient><mask id="mask-line-series-141"><path d="
M0,90.25L0.12470689655172507,90.25C14.692966551724135,90.25,10.24841275862069,95,24.8166724137931,95L25.06608620689655,95C39.634345862068955,95,35.18979206896552,94.05,49.75805172413792,94.05L50.00746551724138,94.05C64.5757251724138,94.05,60.131171379310345,61.275,74.69943103448276,61.275L74.94884482758619,61.275C89.5171044827586,61.275,85.07255068965516,95,99.64081034482757,95L99.89022413793103,95C114.45848379310344,95,110.01393,77.9,124.58218965517241,77.9L124.83160344827586,77.9C139.39986310344824,77.9,134.9553093103448,82.65,149.5235689655172,82.65L149.77298275862066,82.65C164.34124241379308,82.65,159.89668862068962,88.825,174.46494827586204,88.825L174.7143620689655,88.825C189.28262172413793,88.825,184.83806793103446,35.625,199.40632758620688,35.625L199.65574137931034,35.625C214.22400103448277,35.625,209.7794472413793,95,224.34770689655173,95L224.59712068965516,95C239.16538034482758,95,234.72082655172412,90.25,249.28908620689654,90.25L249.5385,90.25C264.10675965517237,90.25,259.66220586206896,95,274.2304655172413,95L274.4798793103448,95C289.0481389655172,95,284.6035851724138,95,299.17184482758614,95L299.4212586206896,95C313.98951827586205,95,309.54496448275864,95,324.11322413793107,95L324.3626379310345,95C338.93089758620687,95,334.48634379310346,95,349.0546034482758,95L349.30401724137926,95C363.8722768965517,95,359.4277231034483,95,373.9959827586207,95L374.2453965517241,95C388.8136562068965,95,384.3691024137931,95,398.93736206896546,95L399.18677586206894,95C413.7550355172413,95,409.3104817241379,90.25,423.87874137931027,90.25L424.1281551724137,90.25C438.6964148275861,90.25,434.2518610344827,95,448.82012068965514,95L449.0695344827586,95C463.637794137931,95,459.1932403448276,95,473.76149999999996,95L474.01091379310344,95C488.57917344827587,95,484.13461965517246,95,498.7028793103449,95L498.9522931034483,95C513.5205527586206,95,509.0759989655172,95,523.6442586206896,95L523.893672413793,95C538.4619320689654,95,534.0173782758619,95,548.5856379310344,95L548.8350517241379,95C563.4033113793104,95,558.9587575862068,95,573.5270172413793,95L573.7764310344828,95C588.3446906896552,95,583.9001368965517,95,598.468396551724,95L598.7178103448275,95C613.28607,95,608.8415162068965,95,623.409775862069,95L623.6591896551723,95C638.2274493103448,95,633.7828955172413,85.5,648.3511551724138,85.5L648.6005689655171,85.5C663.1688286206896,85.5,658.7242748275861,60.325,673.2925344827586,60.325L673.5419482758621,60.325C688.1102079310346,60.325,683.665654137931,95,698.2339137931035,95L698.4833275862068,95C713.0515872413793,95,708.6070334482757,95,723.1752931034482,95L723.3,95" stroke="white" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" style="opacity: 1; transition: opacity 100ms; stroke-dasharray: none;"></path></mask></defs><defs><linearGradient id="default-area-mask-143-gradient" x1="0%" x2="100%" y1="0%" y2="0%" gradientUnits="objectBoundingBox"><stop offset="0%" stop-color="black" stop-opacity="1"></stop><stop offset="10%" stop-color="white" stop-opacity="1"></stop><stop offset="90%" stop-color="white" stop-opacity="1"></stop><stop offset="100%" stop-color="black" stop-opacity="1"></stop></linearGradient><linearGradient id="default-area-gradient-142" x1="0%" x2="0%" y1="0%" y2="100%" gradientUnits="objectBoundingBox"><stop offset="0%" stop-color="rgba(45, 173, 230, 0.25)" stop-opacity="0.25"></stop><stop offset="100%" stop-color="rgba(45, 173, 230, 0.25)" stop-opacity="0"></stop></linearGradient></defs><rect x="0" y="-32" width="723.3" height="129" fill="url(#line-line-series-141)" mask="url(#mask-line-series-141)" style="pointer-events: none;"></rect></g></g></svg>
  `;
    return (<>
      <div
        dangerouslySetInnerHTML={{ __html: svgContent }}
        className='w-full flex rounded-xl py-10 px-3 border border-gray-100'
        style={{backgroundColor:"#f1f1f180"}}
      />
      </>
    );
  }
  const width = 700;
  const height = 130;
  const maxChartNumber = Math.max(...chartNumbers); // Tìm giá trị lớn nhất
  const scaleX = width / (chartNumbers.length - 1); // Tính toán khoảng cách giữa các điểm
  const scaleY = height / maxChartNumber; 

  let pathData = `M0,${height - chartNumbers[0] * scaleY}`; // Điểm bắt đầu
  for (let i = 1; i < chartNumbers.length; i++) {
    const x = i * scaleX;
    const y = height - chartNumbers[i] * scaleY;
    const prevX = (i - 1) * scaleX;
    const prevY = height - chartNumbers[i - 1] * scaleY;
    pathData += ` S${prevX + scaleX / 2},${prevY} ${x},${y}`;
  }

  // Nội dung SVG cho đồ thị
  const svgContent = `
    <svg viewBox="0 0 700 130" xmlns="http://www.w3.org/2000/svg" width="772" height="130" class="_SVG_11yon_154" role="table"><line x2="723.3" stroke="#eeeeef" transform="translate(44.7,100)"></line><line x2="723.3" stroke="#eeeeef" transform="translate(44.7,52.5)"></line><line x2="723.3" stroke="#eeeeef" transform="translate(44.7,5)"></line><g transform="translate(44.7,5)" style="
"><g opacity="1"><defs><linearGradient id="line-line-series-141" x1="0%" x2="0%" y1="100%" y2="0%" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#0A97D5" stop-opacity="1"></stop><stop offset="100%" stop-color="#50C3F7" stop-opacity="1"></stop></linearGradient><mask id="mask-line-series-141"><path d="${pathData}" stroke="white" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" style="opacity: 1; transition: opacity 100ms; stroke-dasharray: none;"></path></mask></defs><defs><linearGradient id="default-area-mask-143-gradient" x1="0%" x2="100%" y1="0%" y2="0%" gradientUnits="objectBoundingBox"><stop offset="0%" stop-color="black" stop-opacity="1"></stop><stop offset="10%" stop-color="white" stop-opacity="1"></stop><stop offset="90%" stop-color="white" stop-opacity="1"></stop><stop offset="100%" stop-color="black" stop-opacity="1"></stop></linearGradient><linearGradient id="default-area-gradient-142" x1="0%" x2="0%" y1="0%" y2="100%" gradientUnits="objectBoundingBox"><stop offset="0%" stop-color="rgba(45, 173, 230, 0.25)" stop-opacity="0.25"></stop><stop offset="100%" stop-color="rgba(45, 173, 230, 0.25)" stop-opacity="0"></stop></linearGradient></defs><rect x="0" y="-32" width="723.3" height="129" fill="url(#line-line-series-141)" mask="url(#mask-line-series-141)" style="pointer-events: none;"></rect></g></g></svg>
  `;
  return (<>
    <div
      dangerouslySetInnerHTML={{ __html: svgContent }}
      className='w-full flex rounded-xl py-10 px-3 border border-gray-100'
      style={{backgroundColor:"#f1f1f180"}}
    />
    </>);
}