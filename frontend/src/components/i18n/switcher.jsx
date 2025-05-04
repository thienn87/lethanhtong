export function Switcher({translate,fixed}) {
  const handleTranslate = (event) => {
    translate(event.target.value)
  }
   
  return (
    <>
    <div style={{zIndex:"999999999"}} className={ fixed !== undefined ? "wp-flex wp-fixed wp-top-[50px] wp-right-[10px] wp-rounded-md wp-border-2 wp-border-indigo-200 wp-border-b-indigo-500 wp-border-l-indigo-300" : "wp-mx-auto wp-flex wp-w-[124px] wp-rounded-md wp-border-2 wp-border-indigo-200 wp-border-b-indigo-500 wp-border-l-indigo-300"}>
      <svg className="wp-w-[30px] wp-bg-white wp-rounded-l-md" fill="rgb(99 102 241)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="m7.744 9.625-.744-2.046-.744 2.046h1.488Z"></path><path d="M12.712 10.656c.301-.354.519-.737.679-1.109a5.454 5.454 0 0 0 .388-1.422h-2.134l.021.143c.054.339.16.798.368 1.28.16.37.377.754.678 1.108Z"></path><path fillRule="evenodd" d="M10.518 15.5h3.982a3.25 3.25 0 0 0 3.25-3.25v-6a3.25 3.25 0 0 0-3.25-3.25h-9a3.25 3.25 0 0 0-3.25 3.25v6a3.25 3.25 0 0 0 3.25 3.25h1.25v.75a1.25 1.25 0 0 0 2.134.884l1.634-1.634Zm-2.93-9.964a.625.625 0 0 0-1.175 0l-2 5.5a.625.625 0 0 0 1.174.428l.225-.618c.06.019.122.029.188.029h2.199l.214.589a.625.625 0 0 0 1.174-.428l-2-5.5Zm5.162-.161a.625.625 0 0 0-.625.625v.875h-1.875a.625.625 0 1 0 0 1.25h.136a6.711 6.711 0 0 0 .499 1.916c.202.47.484.964.874 1.423a4.399 4.399 0 0 1-1.166.481.625.625 0 1 0 .314 1.21 5.517 5.517 0 0 0 1.805-.82 5.518 5.518 0 0 0 1.805.82.625.625 0 1 0 .314-1.21 4.399 4.399 0 0 1-1.166-.48c.39-.46.672-.954.874-1.424a6.708 6.708 0 0 0 .499-1.916h.212a.625.625 0 1 0 0-1.25h-1.875v-.875a.625.625 0 0 0-.625-.625Z"></path></svg>
      <select onChange={(event) => handleTranslate(event)} className="wp-w-[100px] wp-bg-indigo-200 wp-text-indigo-500 wp-text-sm wp-text-center" style={{zIndex:"10000"}}>
        <option value="en">🇬🇧 English</option>
        <option value="fr">🇫🇷 Française</option>
        <option value="es">🇪🇸 Español</option>
        <option value="it">🇮🇹 Italiano</option>
        <option value="de">🇩🇪 Deutsch</option>
        <option value="ja">🇨🇳 日本語 (Nihongo)</option>
        <option value="zh">🇯🇵 中文 (Zhōngwén)</option>
      </select>
    </div>
    </>
  );
}
