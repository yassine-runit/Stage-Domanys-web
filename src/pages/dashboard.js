import React, { useEffect, useState, useRef, useCallback } from "react";
import "../styles/dashboard.css";
import { CheckIcon, ClockIcon } from "../Themes/Images";
import Popup from "../components/popup";
import { usePrestations } from "../context/PrestationsContext";

const Dashboard = ({ selectedCollaborators, selectedServices, selectedPatrimoine }) => {
  const {
    fetchPrestations,
    lastUpdate
  } = usePrestations();

  const [events, setEvents] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [filterType, setFilterType] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [validationMessage, setValidationMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const calendarRef = useRef(null);

  
  const TIMEZONE_OFFSET = 2; 

  
  const getStartOfWeek = useCallback((date) => {
    
    const startOfWeek = new Date(date);

    
    const day = startOfWeek.getDay();

    
    const diff = day === 0 ? 6 : day - 1;

    
    startOfWeek.setDate(startOfWeek.getDate() - diff);

    
    startOfWeek.setHours(0, 0, 0, 0);

    return startOfWeek;
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

  const fetchEvents = useCallback(async () => {
    try {
      if (selectedCollaborators.length === 0) {
        setEvents([]);
        return;
      }

      setIsLoading(true);

      
      const startOfWeek = currentWeek; 
      const endOfWeek = new Date(new Date(currentWeek).setDate(currentWeek.getDate() + 6)); 

      
      endOfWeek.setHours(23, 59, 59, 999);

      const data = await fetchPrestations(startOfWeek, endOfWeek, filterType);

      
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
  }, [selectedCollaborators, selectedServices, selectedPatrimoine, currentWeek, filterType, fetchPrestations]);

  useEffect(() => {
    fetchEvents();
  }, [selectedCollaborators, selectedServices, selectedPatrimoine, currentWeek, filterType, fetchEvents, lastUpdate]);

  const changeWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeek(getStartOfWeek(newDate));
  };

  const handleEventClick = (event) => {
    setSelectedEvent({
      ...event,
      id: event.id
    });
  };

  const closePopup = () => {
    setSelectedEvent(null);
  };

  const handleEventDeleted = () => {
    closePopup();
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

  
  const getAdjustedHour = (dateString) => {
    try {
      
      const date = new Date(dateString);

      
      const utcHours = date.getUTCHours();

     
      const adjustedHour = (utcHours + TIMEZONE_OFFSET) % 24;

      return adjustedHour;
    } catch (error) {
      console.error("Erreur d'extraction de l'heure:", error, "pour la date:", dateString);
      return 0;
    }
  };

  const EventItem = ({ event, onClick }) => {
    
    const duration = (new Date(event.date_fin) - new Date(event.date_debut)) / (1000 * 60 * 60) * 80;

   
    const formatTimeWithoutTimezoneConversion = (dateString) => {
      try {
        
        const date = new Date(dateString);

       
        const utcHours = date.getUTCHours();
        const minutes = date.getUTCMinutes();

      
        const adjustedHours = (utcHours + TIMEZONE_OFFSET) % 24;

       
        return `${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } catch (error) {
        console.error("Erreur de formatage de la date:", error, "pour la date:", dateString);
        return "00:00";
      }
    };

    const startTime = formatTimeWithoutTimezoneConversion(event.date_debut);
    const endTime = formatTimeWithoutTimezoneConversion(event.date_fin);

    const handleClick = () => {
      onClick({
        ...event,
        id: event.id 
      });
    };

    return (
      <div
        className="event"
        style={{
          backgroundColor: `${event.distinctcolor}60`,
          border: `2px solid ${event.distinctcolor}`,
          height: `${duration}px`,
        }}
        onClick={handleClick}
      >
        <div className="event-time-wrapper">
          <div className="event-time-debut" style={{ backgroundColor: event.distinctcolor }}>
            {startTime}
          </div>
          <div className="event-time-fin" style={{ backgroundColor: event.distinctcolor }}>
            {endTime}
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
              <img src={CheckIcon} alt="Validée" style={{ marginRight: '2px' }} />
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

   
    if (process.env.NODE_ENV === 'development') {
      console.log("Nombre total d'événements:", events.length);
    }

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
                  try {
                    
                    const eventDate = new Date(event.date_debut);

                   
                    const adjustedEventHour = getAdjustedHour(event.date_debut);

                   
                    const eventDayJS = eventDate.getDay();

                    
                    const eventDayIndex = eventDayJS === 0 ? 6 : eventDayJS - 1;

                   
                    const dayMatches = eventDayIndex === index;

                    const startOfWeek = currentWeek;
                    const endOfWeek = new Date(new Date(currentWeek).setDate(currentWeek.getDate() + 6)); 
                    endOfWeek.setHours(23, 59, 59, 999); 

                    const isInCurrentWeek = eventDate >= startOfWeek && eventDate <= endOfWeek;

                    const hourMatches = adjustedEventHour === hour;

                    return dayMatches && isInCurrentWeek && hourMatches;
                  } catch (error) {
                    console.error("Erreur lors du filtrage de l'événement:", error, event);
                    return false;
                  }
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
            {currentWeek.toLocaleDateString('fr-FR')} - {new Date(new Date(currentWeek).setDate(currentWeek.getDate() + 6)).toLocaleDateString('fr-FR')}
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
          onValidate={() => {
            setValidationMessage({
              type: 'success',
              text: 'Prestation validée avec succès !'
            });
            setTimeout(() => {
              setValidationMessage(null);
            }, 3000);
          }}
          onDelete={handleEventDeleted}
        />
      )}

      {validationMessage && (
        <div
          className={`success-popup ${validationMessage.type}`}
        >
          {validationMessage.text}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
