export function ShopifyProductList({titles,products,click}) {
    const Title = () => {
      if ( titles !== undefined ){
        return <div className="flex w-full p-4" style={{display:"flex",width:"100%",padding:"15px"}}>

          { titles.map((title,index) => 
            <div key={index} className="me-auto w-1/4" style={{marginLeft:"auto",width:"25%"}}>
              {title}
            </div>
          )}

        </div>;
      }
    }
    const Product = () => {
      if (products !== undefined) {
        return (
          <>
            {products.map((product, index) => (
              <div key={index} className="px-4 w-full" style={{backgroundColor: index % 2 == 0 ? "#f4f4f4" : "white",paddingLeft:"15px",paddingRight:"15px",width:"100%"}}>
                <div className="flex py-4" style={{display:"flex",paddingBottom:"15px",paddingTop:"15px"}}>
                  {Object.keys(product).map((key,index) => (
                      <div
                      className="me-auto w-1/4"
                      style={{marginLeft:"auto",width:"25%"}}
                      key={index}
                      >
                      {
                        String(product[key]).indexOf('files') > 0 ?
                        <div style={{
                          borderRadius:"10px",
                          background:"url(" + String(product[key]) + '&width=60' + ")",
                          backgroundSize:"cover",
                          backgroundRepeat:"no-repeat",
                          width:"40px",
                          height:"40px",
                          border:"solid 1px #d4d4d4",
                          marginRight:"auto",
                          alignSelf: "center",
                          backgroundPosition:"center"
                        }}></div> : <div style={{marginTop:"10px",cursor:"pointer"}} onClick={click}>{product[key]}</div>
                       }
                    </div>
                  ))}
                </div>
                <div style={{height:"5px"}}></div>
                </div>
            ))}
          </>
        );
      } 
    };
    
    return (<>
            <div className="w-full py-4" style={{width:"100%",borderRadius:"12px",backgroundColor:"white",border:"none"}}>
              <Title/>
              <div style={{height:"10px",width:"100%"}}></div>
              <Product/>
            </div>            
      </>);
  }