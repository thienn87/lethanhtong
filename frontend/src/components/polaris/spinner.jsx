export function Spinner({color}){
  const loaderStyle = {
    width: '20px',
    padding: '2px',
    aspectRatio: '1',
    borderRadius: '50%',
    background: color === undefined ? '#25b09b' : color,
    mask: 'conic-gradient(#0000 10%,#000), linear-gradient(#000 0 0) content-box',
    WebkitMask: 'conic-gradient(#0000 10%,#000), linear-gradient(#000 0 0) content-box',
    WebkitMaskComposite: 'source-out',
    maskComposite: 'subtract',
    animation: 'l3 1s infinite linear'
  };

  const keyframes = `
    @keyframes l3 {
      to {
        transform: rotate(1turn);
      }
    }
  `;

  return (
    <div className="flex w-full">
      <style>
        {keyframes}
      </style>
      <div style={loaderStyle} className="loader mx-auto"></div>
    </div>
  );
};