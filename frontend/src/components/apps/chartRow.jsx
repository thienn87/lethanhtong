export function ChartRow() {
   
    return (
      <>
      <div className="items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm sm:flex dark:border-gray-700 sm:p-6 dark:bg-gray-800">
        <div className="w-full">
          <h3 className="text-base font-normal text-gray-500 dark:text-gray-400">Category position</h3>
          <span className="text-2xl font-bold leading-none text-gray-900 sm:text-3xl dark:text-white">26</span>
          <p className="flex items-center text-base font-normal text-gray-500 dark:text-gray-400">
            <span className="flex items-center mr-1.5 text-sm text-green-500 dark:text-green-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path clip-rule="evenodd" fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"></path>
              </svg>
              10% 
            </span>
            Since last month
          </p>
        </div>

        <div className="w-full">
          <svg
            width="229"
            height="140"
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            style={{ background: 'transparent' }}
          >
            <g className="apexcharts-inner apexcharts-graphical" transform="translate(12, 30)">
              <defs>
                <linearGradient id="linearGradient1" x1="0" y1="0" x2="0" y2="1">
                  <stop stopOpacity="0.4" stopColor="rgba(216,227,240,0.4)" offset="0" />
                  <stop stopOpacity="0.5" stopColor="rgba(190,209,230,0.5)" offset="1" />
                  <stop stopOpacity="0.5" stopColor="rgba(190,209,230,0.5)" offset="1" />
                </linearGradient>
                <clipPath id="clipPath1">
                  <rect width="211" height="78" x="-2" y="0" fill="#fff" />
                </clipPath>
                <clipPath id="clipPath2" />
                <clipPath id="clipPath3">
                  <rect width="211" height="82" x="-2" y="-2" fill="#fff" />
                </clipPath>
              </defs>
              <rect
                width="7.39"
                height="78"
                x="70.23"
                y="0"
                fill="url(#linearGradient1)"
                fillOpacity="0.9"
              />
              <g className="apexcharts-xaxis">
                <g className="apexcharts-xaxis-texts-g" transform="translate(0, 4)" />
              </g>
              <g className="apexcharts-grid">
                <g className="apexcharts-gridlines-horizontal" style={{ display: 'none' }}>
                  <line x1="0" y1="0" x2="207" y2="0" stroke="#e0e0e0" />
                  <line x1="0" y1="15.6" x2="207" y2="15.6" stroke="#e0e0e0" />
                  <line x1="0" y1="31.2" x2="207" y2="31.2" stroke="#e0e0e0" />
                  <line x1="0" y1="46.8" x2="207" y2="46.8" stroke="#e0e0e0" />
                  <line x1="0" y1="62.4" x2="207" y2="62.4" stroke="#e0e0e0" />
                  <line x1="0" y1="78" x2="207" y2="78" stroke="#e0e0e0" />
                </g>
                <g className="apexcharts-gridlines-vertical" style={{ display: 'none' }}>
                  <line x1="0" y1="78" x2="207" y2="78" stroke="transparent" />
                  <line x1="0" y1="1" x2="0" y2="78" stroke="transparent" />
                </g>
              </g>
              <g className="apexcharts-bar-series apexcharts-plot-series">
                <g className="apexcharts-series" rel="1" seriesName="Users" data-realIndex="0">
                  <rect width="7.39" height="78" x="11.09" y="0" fill="#374151" />
                  <path
                    d="M11.09 78L11.09 46.32C11.09 44.32 12.09 43.32 14.09 43.32L15.48 43.32C17.48 43.32 18.48 44.32 18.48 46.32L18.48 46.32L18.48 78L18.48 78C18.48 78 11.09 78 11.09 78z"
                    fill="rgba(26,86,219,1)"
                  />
                  <rect width="7.39" height="78" x="40.66" y="0" fill="#374151" />
                  <path
                    d="M40.66 78L40.66 17.69C40.66 15.69 41.66 14.69 43.66 14.69L45.05 14.69C47.05 14.69 48.05 15.69 48.05 17.69L48.05 17.69L48.05 78L48.05 78C48.05 78 40.66 78 40.66 78z"
                    fill="rgba(26,86,219,1)"
                  />
                  <rect width="7.39" height="78" x="70.23" y="0" fill="#374151" />
                  <path
                    d="M70.23 78L70.23 35.42C70.23 33.42 71.23 32.42 73.23 32.42L74.63 32.42C76.63 32.42 77.63 33.42 77.63 35.42L77.63 35.42L77.63 78L77.63 78C77.63 78 70.23 78 70.23 78z"
                    fill="rgba(26,86,219,1)"
                  />
                  <rect width="7.39" height="78" x="99.80" y="0" fill="#374151" />
                  <path
                    d="M99.80 78L99.80 46.47C99.80 44.47 100.80 43.47 102.80 43.47L104.20 43.47C106.20 43.47 107.20 44.47 107.20 46.47L107.20 46.47L107.20 78L107.20 78C107.20 78 99.80 78 99.80 78z"
                    fill="rgba(26,86,219,1)"
                  />
                  <rect width="7.39" height="78" x="129.38" y="0" fill="#374151" />
                  <path
                    d="M129.38 78L129.38 50.97C129.38 48.97 130.38 47.97 132.38 47.97L133.77 47.97C135.77 47.97 136.77 48.97 136.77 50.97L136.77 50.97L136.77 78L136.77 78C136.77 78 129.38 78 129.38 78z"
                    fill="rgba(26,86,219,1)"
                  />
                  <rect width="7.39" height="78" x="158.95" y="0" fill="#374151" />
                  <path
                    d="M158.95 78L158.95 38.57C158.95 36.57 159.95 35.57 161.95 35.57L163.34 35.57C165.34 35.57 166.34 36.57 166.34 38.57L166.34 38.57L166.34 78L166.34 78C166.34 78 158.95 78 158.95 78z"
                    fill="rgba(26,86,219,1)"
                  />
                  </g>
                </g>
              </g>
            </svg>
        </div>
      </div>
                  </>
    );
  }
  