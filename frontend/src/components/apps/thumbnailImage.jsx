export function ThumbnailImage({image,margin,w,h,borderRadius,border,bgSize}) {
  return (
    <>
    {!image && !margin && !w && !h && !borderRadius && !border ? 
      <>[ThumbnailImage image= margin= w= h= borderRadius= border=][/thumbnailImage]</> :
    <>
    <div style={{
      borderRadius: borderRadius !== undefined ? borderRadius : "10px",
      backgroundImage:"url(" +image+ ")",
      backgroundRepeat:"no-repeat",
      width: w !== undefined ? w : "40px",
      height: h !== undefined ? h : "40px",
      border: border !== undefined ? border : "solid 1px #d1d1d1",
      margin: margin !== undefined ? margin : "auto",
      alignSelf: "center",
      backgroundPosition:"center",
      backgroundSize: bgSize !== undefined ? bgSize : "cover",
    }}></div>
    </> }
    </>);
}
