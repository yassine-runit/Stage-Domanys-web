import React, { useState, useEffect } from "react";
import "../styles/login.css";  
import { LogoImg, EmailIcon, LockIcon, ShowIcon, HideIcon } from "../Themes/Images";  
import config from '../config';
import { jwtDecode } from "jwt-decode";

const Login = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      window.location.href = "/dashboard"; 
    }
  }, []);

  

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage("");
  
    try {
      const response = await fetch(`${config.API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
  
      const data = await response.json();
      console.log("Réponse API :", data);
  
      if (response.ok) {
        if (!data.token) {
          throw new Error("Token manquant dans la réponse.");
        }
  
        localStorage.setItem("token", data.token);
  
        
        try {
          const decodedToken = jwtDecode(data.token);
          const userRole = decodedToken.role || "collab"; 
          localStorage.setItem("userRole", userRole);
        } catch (error) {
          console.error("Erreur de décodage du token :", error);
        }
  
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          console.warn("Données utilisateur manquantes dans la réponse.");
        }
  
        window.location.href = "/dashboard";
      } else {
        setErrorMessage(data.message || "Nom d'utilisateur ou mot de passe incorrect.");
      }
    } catch (error) {
      console.error("Erreur lors de la connexion :", error);
      setErrorMessage("Erreur de connexion. Vérifiez votre réseau.");
    } finally {
      setLoading(false);
    }
  };
  const userRole = localStorage.getItem("userRole");
 console.log("Rôle récupéré :", userRole);



  return (
    <div className="login-container">
      <div className="login-box">
        <img src={LogoImg} alt="Logo" className="logo" />
        <p className="text">connectez-vous à votre compte</p>

        <div className="input-container">
    <div className="icon-container">
        <img src={EmailIcon} alt="Email Icon" className="EmailIcon" />
    </div>
    <input
        type="text"
        placeholder="Nom d'utilisateur"
        value={name}
        onChange={(e) => setName(e.target.value)}
    />
    </div>

    <div className="input-container">
    <div className="icon-container">
        <img src={LockIcon} alt="Lock Icon" className="LockIcon" />
    </div>
    <input
        type={secureTextEntry ? "password" : "text"}
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
    />
    <span
        className="toggle-password"
        onClick={() => setSecureTextEntry(!secureTextEntry)}
    >
        <img
        src={secureTextEntry ? ShowIcon : HideIcon} 
        alt="Toggle Password Visibility"
        className={`toggle-icon ${secureTextEntry ? 'show-icon-style' : 'hide-icon-style'}`}  
        />
    </span>
    </div>

        {errorMessage && <p className="error-text">{errorMessage}</p>}

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <button className="button" onClick={handleLogin}>
            Se connecter
          </button>
        )}
      </div>
    </div>
  );
};

export default Login;
