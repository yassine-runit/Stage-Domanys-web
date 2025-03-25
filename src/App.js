import React, { useState, useEffect } from "react"; 
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"; 
import Header from "./components/header"; 
import Sidebar from "./components/sidebar"; 
import Dashboard from "./pages/dashboard"; 
import Login from "./pages/login"; 
import Utilisateurs from "./pages/utilisateurs"; 
import Patrimoines from "./pages/patrimoines"; 
import Agences from "./pages/agences"; 
import "./styles/global.css";  

const Layout = ({ children, onFilterChange }) => {   
  const location = useLocation();   
  const showLayout = location.pathname !== "/login";      
  return showLayout ? (     
    <div className="app-container">       
      <Header onFilterChange={onFilterChange} />       
      <div className="main-layout">         
        <Sidebar onFilterChange={onFilterChange} />         
        <div className="main-content">{children}</div>       
      </div>     
    </div>   
  ) : (     
    <>{children}</>   
  ); 
};  

const App = () => {   
  const [selectedCollaborators, setSelectedCollaborators] = useState([]);   
  const [selectedServices, setSelectedServices] = useState([]);   
  const [selectedPatrimoine, setSelectedPatrimoine] = useState(null);    

  useEffect(() => {     
    console.log("État de selectedPatrimoine dans App.js:", selectedPatrimoine);   
  }, [selectedPatrimoine]);    

  const handleFilterChange = (collabs, services, patrimoine) => {     
    console.log("handleFilterChange reçoit:", {       
      collabs,       
      services,       
      patrimoine,       
      typePatrimoine: typeof patrimoine     
    });      

    
    const newPatrimoine = patrimoine !== undefined 
      ? patrimoine 
      : selectedPatrimoine;

    console.log("Valeur finale de patrimoineId:", newPatrimoine);      

    setSelectedCollaborators(collabs || []);     
    setSelectedServices(services || []);     
    setSelectedPatrimoine(newPatrimoine);   
  };    

  return (     
    <Router>       
      <Routes>         
        <Route path="/login" element={<Login />} />                           
        <Route           
          path="/dashboard"           
          element={             
            <Layout onFilterChange={handleFilterChange}>               
              <Dashboard                 
                selectedCollaborators={selectedCollaborators}                 
                selectedServices={selectedServices}                 
                selectedPatrimoine={selectedPatrimoine}               
              />             
            </Layout>           
          }         
        />         
        <Route           
          path="/utilisateurs"           
          element={             
            <Layout onFilterChange={handleFilterChange}>               
              <Utilisateurs />             
            </Layout>           
          }         
        />         
        <Route           
          path="/patrimoines"           
          element={             
            <Layout onFilterChange={handleFilterChange}>               
              <Patrimoines />             
            </Layout>           
          }         
        />         
        <Route           
          path="/agences"           
          element={             
            <Layout onFilterChange={handleFilterChange}>               
              <Agences />             
            </Layout>           
          }         
        />                           
        <Route path="*" element={<Login />} />       
      </Routes>     
    </Router>   
  ); 
};  

export default App;