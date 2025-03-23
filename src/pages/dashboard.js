import React, { useEffect, useState, useRef } from "react";
import "../styles/dashboard.css";
import config from "../config";
import { CheckIcon, ClockIcon } from "../Themes/Images";
import Popup from "../components/popup";

const Dashboard = ({ selectedCollaborators, selectedServices, selectedPatrimoine }) => {
  const [events, setEvents] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [filterType, setFilterType] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const calendarRef = useRef(null);



  useEffect(() => {
    console.log("Props reçues dans Dashboard:", {
      selectedCollaborators,
      selectedServices,
      selectedPatrimoine,
      typePatrimoine: typeof selectedPatrimoine
    });
  }, [selectedCollaborators, selectedServices, selectedPatrimoine]);

  const getStartOfWeek = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
   
    const diff = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  };

  
  useEffect(() => {
    const today = new Date();
    setCurrentWeek(getStartOfWeek(today));
    setCurrentTime(today);


    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  
  useEffect(() => {
    if (calendarRef.current) {
      const currentHour = new Date().getHours();
      const scrollPosition = currentHour * 60; 
      calendarRef.current.scrollTop = scrollPosition - 100; 
    }
  }, []);


  useEffect(() => {
    const fetchEvents = async () => {
      try {
      
        if (selectedCollaborators.length === 0) {
          setEvents([]);
          return;
        }

        const startOfWeek = getStartOfWeek(currentWeek);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
  
        const startOfWeekStr = startOfWeek.toISOString().split("T")[0];
        const endOfWeekStr = endOfWeek.toISOString().split("T")[0];
  
      
        let apiUrl = `${config.API_BASE_URL}/prestations/semaine/test?startOfWeek=${startOfWeekStr}&endOfWeek=${endOfWeekStr}`;
        
        
        if (filterType === 1) {
          apiUrl += '&est_recurrent=1';
        }
        
        console.log(`Appel API: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
  
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
  
        const data = await response.json();
        
        console.log("Données récupérées:", data);
        console.log("Patrimoine sélectionné:", selectedPatrimoine);
  
        
        const filteredEvents = data.filter((event) => {
          const matchesCollaborators = selectedCollaborators.includes(event.id_collaborateur);
          const matchesServices = selectedServices.length === 0 || selectedServices.includes(event.id_type_prestation);
          const matchesPatrimoine = selectedPatrimoine === null || selectedPatrimoine === undefined || String(event.id_patrimoine) === String(selectedPatrimoine);
  
          console.log("Comparaison pour événement:", event.id, 
                     "id_patrimoine:", event.id_patrimoine, 
                     "selectedPatrimoine:", selectedPatrimoine, 
                     "type selectedPatrimoine:", typeof selectedPatrimoine,
                     "matchesPatrimoine:", matchesPatrimoine);
  
          return matchesCollaborators && matchesServices && matchesPatrimoine;
        });
  
        console.log("Événements filtrés:", filteredEvents);
        console.log("Nombre d'événements filtrés:", filteredEvents.length);
        setEvents(filteredEvents);
      } catch (error) {
        console.error("Erreur lors du chargement des prestations", error);
      }
    };
  
    fetchEvents();
  }, [selectedCollaborators, selectedServices, currentWeek, filterType, selectedPatrimoine]);
  


  const changeWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeek(getStartOfWeek(newDate));
  };


  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };


  const closePopup = () => {
    setSelectedEvent(null);
  };

  
  const validateEvent = () => {
    if (selectedEvent) {
      const updatedEvents = events.map((event) =>
        event.id === selectedEvent.id ? { ...event, statut: "Validée" } : event
      );
      setEvents(updatedEvents);
      closePopup();
    }
  };

  
  const getCurrentTimePosition = () => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return (hours + minutes / 60) * 60; 
  };

  
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  
  const renderCalendar = () => {
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const timePosition = getCurrentTimePosition();

    return (
      <div className="calendar-container" ref={calendarRef}>
        <div className="header-row">
          <div className="time-column"></div>
          {days.map((day, index) => {
            const date = new Date(currentWeek);
            date.setDate(date.getDate() + index);
            const todayClass = isToday(date) ? "today" : "";
            return (
              <div key={day} className={`day-column ${todayClass}`}>
                <div className="day-header">
                  {day}<br />
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
        <div className="calendar-body">
          {hours.map((hour) => (
            <div key={hour} className="hour-row">
              <div className="time-column">{`${hour}:00`}</div>
              {days.map((day, index) => {
                const date = new Date(currentWeek);
                date.setDate(date.getDate() + index);
                const dayEvents = events.filter((event) => {
                  const eventDate = new Date(event.date_debut);
                  return eventDate.getDate() === date.getDate() && eventDate.getHours() === hour;
                });
                return (
                  <div key={`${day}-${hour}`} className="day-cell">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="event"
                        style={{
                          backgroundColor: `${event.distinctcolor}60`,
                          border: `2px solid ${event.distinctcolor}`,
                          height: `${(new Date(event.date_fin) - new Date(event.date_debut)) / (1000 * 60 * 60) * 80}px`,
                        }}
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="event-time-wrapper">
                          <div className="event-time-debut" style={{ backgroundColor: event.distinctcolor }}>
                            {new Date(event.date_debut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="event-time-fin" style={{ backgroundColor: event.distinctcolor }}>
                            {new Date(event.date_fin).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        <div className="event-details" style={{ color: event.distinctcolor }}>
                          <div className="event-details-prestation">{event.type_prestation_name}</div>
                          <div className="event-details-patrimoine">{event.id_patrimoine}</div>
                        </div>
                        <div className="event-status">
                          {event.statut === "En cours" && <img src={ClockIcon} alt="En cours" />}
                          {event.statut === "Terminée" && <img src={CheckIcon} alt="Terminée" />}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
          
          
          {days.some((_, index) => {
            const date = new Date(currentWeek);
            date.setDate(date.getDate() + index);
            return isToday(date);
          }) && (
            <div
              className="current-time-line"
              style={{ top: `${timePosition}px` }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <div className="headerCalendar">
        <div className="current-day">
          Aujourd'hui: {new Date().toLocaleDateString()}
        </div>
        <div className="week-navigation">
          <button onClick={() => changeWeek("prev")}>&lt;</button>
          <div className="current-week">
            {currentWeek.toLocaleDateString()} - {new Date(new Date(currentWeek).setDate(currentWeek.getDate() + 6)).toLocaleDateString()}
          </div>
          <button onClick={() => changeWeek("next")}>&gt;</button>
        </div>
        <div className="filter-section">
          <button 
            className={filterType === 0 ? "active" : ""} 
            onClick={() => setFilterType(0)}
          >
            Semaine en cours
          </button>
          <button 
            className={filterType === 1 ? "active" : ""} 
            onClick={() => setFilterType(1)}
          >
            Semaine type
          </button>
        </div>
      </div>
      {renderCalendar()}

      
      <Popup isOpen={selectedEvent !== null} onClose={closePopup} onValidate={validateEvent}>
        {selectedEvent && (
          <div>
            <h2>{selectedEvent.type_prestation_name}</h2>
            <p>
              <img src="/icons/calendar-icon.png" alt="Date" className="popup-icon" />
              {new Date(selectedEvent.date_debut).toLocaleDateString()}
            </p>
            <p>
              <img src="/icons/clock-icon.png" alt="Heure" className="popup-icon" />
              {new Date(selectedEvent.date_debut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - 
              {new Date(selectedEvent.date_fin).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p>
              <img src="/icons/location-icon.png" alt="Adresse" className="popup-icon" />
              {selectedEvent.adresse || "Adresse non renseignée"}
            </p>
            <p>
              <img src="/icons/id-icon.png" alt="Référence" className="popup-icon" />
              {selectedEvent.id_patrimoine || "Non renseigné"}
            </p>
            <div>
              <input type="checkbox" id="arrival" />
              <label htmlFor="arrival">Heure d'arrivée</label>
            </div>
            <div>
              <input type="checkbox" id="departure" />
              <label htmlFor="departure">Heure de départ</label>
            </div>
          </div>
        )}
      </Popup>
    </div>
  );
};

export default Dashboard;