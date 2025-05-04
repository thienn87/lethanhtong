import { useState } from "react";
import {Button} from "../polaris/button";
import {Spinner} from "../polaris/spinner";


export function Search({api,buttonName,buttonSearch,placeholder,tone,returnResults}) {
  const [students, setStudents] = useState(null);
    const [loading,setLoading] = useState(null);
  if(!api && !buttonName) return <>[Search api= link api buttonName= name of button/]</>
    
    const SearchApi = async () => {
      setLoading(true)
        try {
            const response = await fetch(api + '?keyword=' + students);
            const data = await response.json();
            returnResults(data.data); 
        } catch (error) {
            console.error('Error fetching students:', error);
        }
        setLoading(null)
    };
    
    return (<>
      <div style={{display:"flex", width:"100%"}}>
        <div style={{position:"relative",width:"70%"}}>
          <svg style={{position:"absolute",top:"5px",left:"5px", height:"20px"}} fill={tone == "white" ? "#8a8888" : "#ebebeb" } viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
          <input type="text" name="email" className="rounded-xl px-10" 
            style={{ border: tone == "white" ? "solid 1px #ebebeb" : "solid 1px #525252", color: tone == "white" ? "#303030" : "#f1f1f1",borderBottom: tone == "white" ? "solid 1px #ebebeb" : "solid 1px #383838",height:"30px", backgroundColor: tone == "white" ? "white" : "#303030", width:"100%"}}
            placeholder={placeholder}
            onChange={(event) => setStudents(event.target.value)}
          />
        </div>
        <div style={{width:"calc(30% - 10px)",marginLeft:"10px"}} className="self-center">
          <Button tone={tone} click={() => SearchApi()}>{buttonSearch}</Button>
        </div>    
      </div>
      { loading === true ? <><div style={{height:"20px"}}></div><Spinner/></> : null }
      
    </>);
  }