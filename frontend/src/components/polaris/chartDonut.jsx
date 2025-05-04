import { useEffect, useRef, useState } from 'react';

export function ChartDonut({ score }) {
  const [displayScore, setDisplayScore] = useState(0);
  const requestRef = useRef(null);
  const [offset,setOffset] = useState(0);
  useEffect(() => {
    // Animation function
    const animateScore = () => {
      const start = displayScore;
      const end = score;
      const duration = 1000; // Thay đổi thời gian của animation nếu cần
      let startTime = null;

      const updateScore = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        setDisplayScore(Math.floor(progress * (end - start) + start));

        if (progress < 1) {
          requestRef.current = requestAnimationFrame(updateScore);
        }
      };

      requestRef.current = requestAnimationFrame(updateScore);
    };

    animateScore();
    setOffset( parseFloat(-185*score/100 ));
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [score]);
  
  return (<div className='relative p-6'>
    <svg className="rc-progress-circle ChartScoreSpeed__circle-custom" viewBox="-50 -50 100 100" role="presentation"><defs>
      <linearGradient id="rc_progress_2-gradient" x1="100%" y1="0%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="#FD5749"></stop>
        <stop offset="60%" stop-color="#FFC700"></stop>
        <stop offset="100%" stop-color="#0A855C"></stop>
        <stop offset="120%" stop-color="#FD5749"></stop>
        </linearGradient></defs>
        <circle className="rc-progress-circle-path" r="46.5" cx="0" cy="0" stroke="url(#rc_progress_2-gradient)" strokeLinecap="round" strokeWidth="7" opacity="1" 
        style={{
          strokeDasharray: '186.663px, 292.168',
          strokeDashoffset: 0,
          transform: 'rotate(155deg)',
          transformOrigin: '0px 0px',
          transition: 'stroke-dashoffset, stroke-dasharray, stroke, stroke-width 0.3s, opacity',
          fillOpacity: 0,
        }}
        ></circle>
        <circle className="rc-progress-circle-trail" r="46.5" cx="0" cy="0" stroke="#D9D9D9" strokeLinecap="round" strokeWidth="7" 
        style={{
          stroke: 'rgba(255, 255, 255, 0.71)',
          strokeDasharray: '0, 292.168',
          strokeDashoffset: offset,
          transform: 'rotate(155deg)',
          transformOrigin: '0px 0px',
          transition: 'stroke-dashoffset 0.3s, stroke-dasharray 0.3s, stroke 0.3s, stroke-width 0.06s 0.3s, opacity 0.3s',
          fillOpacity: 0,
        }}></circle>
    </svg>
    <div className='absolute w-full text-center left-0' style={{top:"40%"}}>
      <span className='font-bold text-4xl text-[#007a5c]'>{displayScore}+</span>
      <br/>
      <span className="text-md">Standard adapted</span>
      </div>
  </div>);
}
