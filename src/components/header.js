import React, { useEffect, useState, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { Link, useLocation } from "react-router-dom";
import "../styles/header.css";
import config from '../config';
import {
  FiCalendar,
  FiUsers,
  FiBriefcase,
  FiMap,
  FiBell,
  FiAlertCircle,
  FiLogOut,
  FiChevronDown,
  FiSearch,
  FiX
} from "react-icons/fi";

const Header = ({ onFilterChange, selectedCollaborators = [], selectedServices = [] }) => {
  const [user, setUser] = useState({ firstname: "", lastname: "" });
  const [patrimoines, setPatrimoines] = useState([]);
  const [selectedPatrimoine, setSelectedPatrimoine] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        const decodedToken = jwtDecode(storedToken);
        setUser({
          firstname: decodedToken.first_name || "",
          lastname: decodedToken.last_name || "",
        });
      } catch (error) {
        console.error("Erreur lors du décodage du token :", error);
      }
    }
    fetchPatrimoines();
  }, []);


  const fetchPatrimoines = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/patrimoines/all`);
      if (response.ok) {
        const data = await response.json();
        setPatrimoines(data);
      } else {
        console.error("Erreur lors de la récupération des patrimoines");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des patrimoines:", error);
    }
  };


  const handlePatrimoineSelect = (patrimoine) => {
    setSelectedPatrimoine(patrimoine);
    setShowDropdown(false);

    onFilterChange(selectedCollaborators, selectedServices, patrimoine);
  };


  const clearPatrimoineFilter = () => {
    setSelectedPatrimoine(null);
    onFilterChange(selectedCollaborators, selectedServices, null);
  };


  const filteredPatrimoines = patrimoines.filter((patrimoine) =>
    String(patrimoine.id).toLowerCase().includes(searchTerm.toLowerCase())
  );


  const navItems = [
    { icon: <FiCalendar />, label: "Calendrier", path: "/dashboard" },
    { icon: <FiBriefcase />, label: "Agences", path: "/agences" },
    { icon: <FiMap />, label: "Patrimoines", path: "/patrimoines" },
    { icon: <FiUsers />, label: "Utilisateurs", path: "/utilisateurs" },
  ];


  const userMenuItems = [
    { icon: <FiBell />, label: "Notifications", path: "/notifications" },
    { icon: <FiAlertCircle />, label: "Réclamations", path: "/réclamations" },
    {
      icon: <FiLogOut />,
      label: "Déconnexion",
      action: () => {
        localStorage.removeItem("token");
        window.location.replace("/login");
      }
    }
  ];

  return (
    <div className="header">
      <div className="header-left">

        <nav className="nav-menu">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="header-right">

        <div className="patrimoine-filter" ref={dropdownRef}>
          <div
            className="patrimoine-selector"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span>
              {selectedPatrimoine
                ? `Patrimoine: ${selectedPatrimoine.id}`
                : "Choisir un patrimoine"}
            </span>
            <FiChevronDown className="dropdown-icon" />
          </div>

          {selectedPatrimoine && (
            <button
              className="clear-filter-btn"
              onClick={(e) => {
                e.stopPropagation();
                clearPatrimoineFilter();
              }}
            >
              <FiX />
            </button>
          )}

          {showDropdown && (
            <div className="patrimoine-dropdown">
              <div className="search-container">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher par ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="patrimoine-list">


                {filteredPatrimoines.length > 0 ? (
                  filteredPatrimoines.map((patrimoine) => (
                    <div
                      key={patrimoine.id}
                      className="patrimoine-item"
                      onClick={() => handlePatrimoineSelect(patrimoine)}
                    >
                      {patrimoine.id}
                    </div>
                  ))
                ) : (
                  <div className="no-results">Aucun résultat</div>
                )}
              </div>
            </div>
          )}
        </div>


        <div className="user-profile" ref={userMenuRef}>
          <div
            className="user-profile-toggle"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              {user.firstname ? user.firstname.charAt(0) : ""}
              {user.lastname ? user.lastname.charAt(0) : ""}
            </div>
            <span className="user-name">{user.firstname} {user.lastname}</span>
            <FiChevronDown className="dropdown-icon" />
          </div>

          {showUserMenu && (
            <div className="user-dropdown">
              {userMenuItems.map((item, index) => (
                <div
                  key={index}
                  className="user-menu-item"
                  onClick={(e) => {
                    e.preventDefault();
                    if (item.action) {
                      item.action();
                    } else {
                      window.location.replace(item.path);
                    }
                    setShowUserMenu(false);
                  }}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-label">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;