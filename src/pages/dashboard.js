import React, { useEffect, useState, useRef, useCallback } from "react";
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
  const [validationMessage, setValidationMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const calendarRef = useRef(null);

  const getStartOfWeek = useCallback((date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }, []);

  const getEndOfWeek = useCallback((startDate) => {
    const endOfWeek = new Date(startDate);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
  }, []);

  useEffect(() => {
    const today = new Date();
    setCurrentWeek(getStartOfWeek(today));
    setCurrentTime(today);

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, [getStartOfWeek]);

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

        setIsLoading(true);
        const startOfWeek = getStartOfWeek(currentWeek);
        const endOfWeek = getEndOfWeek(startOfWeek);

        const params = new URLSearchParams({
          startOfWeek: startOfWeek.toISOString().split("T")[0],
          endOfWeek: endOfWeek.toISOString().split("T")[0],
          ...(filterType === 1 && { est_recurrent: '1' })
        });

        const apiUrl = `${config.API_BASE_URL}/prestations/semaine/test?${params}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();

        const filteredEvents = data.filter((event) => {
          if (filterType === 1 && event.est_recurrent !== "1") return false;
          
          const matchesCollaborators = selectedCollaborators.includes(event.id_collaborateur);
          const matchesServices = selectedServices.length === 0 || 
              selectedServices.includes(event.id_type_prestation);
            const matchesPatrimoine = !selectedPatrimoine || 
              (selectedPatrimoine && event.id_patrimoine === selectedPatrimoine.id);
          
          return matchesCollaborators && matchesServices && matchesPatrimoine;
        });

        setEvents(filteredEvents);
      } catch (error) {
        console.error("Erreur fetch:", error);
        setValidationMessage({
          type: 'error',
          text: 'Erreur lors du chargement des données'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [selectedCollaborators, selectedServices, currentWeek, filterType, selectedPatrimoine, getStartOfWeek, getEndOfWeek]);

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

  const validateEvent = async () => {
    if (!selectedEvent) return;

    if (selectedEvent.statut === 'Validée') {
      setValidationMessage({
        type: 'error',
        text: 'Cette prestation a déjà été validée.'
      });
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/prestations/${selectedEvent.id}/valider`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la validation');
      }

      const updatedData = await response.json();

      if (updatedData.success) {
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event.id === selectedEvent.id ? { ...event, statut: 'Validée' } : event
          )
        );
        
        setValidationMessage({
          type: 'success',
          text: 'Prestation validée avec succès !'
        });

        setTimeout(() => {
          setValidationMessage(null);
          closePopup();
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setValidationMessage({
        type: 'error',
        text: error.message || 'Erreur lors de la validation'
      });
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

  const EventItem = ({ event, onClick }) => {
    const duration = (new Date(event.date_fin) - new Date(event.date_debut)) / (1000 * 60 * 60) * 80;
    
    return (
      <div
        className="event"
        style={{
          backgroundColor: `${event.distinctcolor}60`,
          border: `2px solid ${event.distinctcolor}`,
          height: `${duration}px`,
        }}
        onClick={() => onClick(event)}
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
          {event.statut === "Validée" && (
            <>
              <img src={CheckIcon} alt="Validée" />
              <img src={CheckIcon} alt="Validée" />
            </>
          )}
        </div>
      </div>
    );
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
                  return eventDate.getDate() === date.getDate() && 
                         eventDate.getHours() === hour;
                });
                
                return (
                  <div key={`${day}-${hour}`} className="day-cell">
                    {dayEvents.map((event) => (
                      <EventItem 
                        key={event.id}
                        event={event}
                        onClick={handleEventClick}
                      />
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

      {isLoading ? (
        <div className="loading">Chargement en cours...</div>
      ) : (
        renderCalendar()
      )}
      
      {selectedEvent && (
        <Popup 
          event={selectedEvent} 
          onClose={closePopup} 
          onValidate={validateEvent} 
        />
      )}
      
      {validationMessage && (
        <div 
          className={`validation-message ${validationMessage.type}`}
          aria-live="polite"
        >
          {validationMessage.text}
        </div>
      )}
    </div>
  );
};

export default Dashboard;