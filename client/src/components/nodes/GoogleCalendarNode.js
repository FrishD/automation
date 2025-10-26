import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import axios from 'axios';

const GoogleCalendarNode = ({ data, id }) => {
  const [settings, setSettings] = useState({
    calendarId: '',
    startTime: '09:00',
    endTime: '17:00',
    meetingDuration: 30,
    breakTime: 15,
    ...data.googleCalendar, // Load existing settings if they exist
  });
  const [calendars, setCalendars] = useState([]);

  useEffect(() => {
    // Fetch the list of Google Calendars from the backend
    const fetchCalendars = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/google-calendar/calendars');
        setCalendars(response.data);
        if (response.data.length > 0 && !settings.calendarId) {
          // Default to the primary calendar if not set
          const primary = response.data.find(cal => cal.primary);
          if (primary) {
            updateSetting('calendarId', primary.id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch Google Calendars', error);
      }
    };
    fetchCalendars();
  }, [settings.calendarId]); // Runs on mount and when calendarId changes

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    // Propagate changes up to the main App component
    if (data.onChange) {
      data.onChange({ ...data, googleCalendar: newSettings });
    }
  };


  return (
    <div className="google-calendar-node">
      <Handle type="target" position={Position.Top} />
      <div className="node-header">Google Calendar Scheduling</div>
      <div className="node-content">
        <label>Calendar:</label>
        <select
          value={settings.calendarId}
          onChange={(e) => updateSetting('calendarId', e.target.value)}
        >
          <option value="">Select a Calendar</option>
          {calendars.map((cal) => (
            <option key={cal.id} value={cal.id}>
              {cal.summary}
            </option>
          ))}
        </select>

        <label>Availability:</label>
        <div className="time-range">
          <input
            type="time"
            value={settings.startTime}
            onChange={(e) => updateSetting('startTime', e.target.value)}
          />
          <span>to</span>
          <input
            type="time"
            value={settings.endTime}
            onChange={(e) => updateSetting('endTime', e.target.value)}
          />
        </div>

        <label>Meeting Duration (minutes):</label>
        <input
          type="number"
          value={settings.meetingDuration}
          onChange={(e) => updateSetting('meetingDuration', parseInt(e.target.value, 10))}
          min="1"
        />

        <label>Break Between Meetings (minutes):</label>
        <input
          type="number"
          value={settings.breakTime}
          onChange={(e) => updateSetting('breakTime', parseInt(e.target.value, 10))}
          min="0"
        />
      </div>
      <Handle type="source" position={Position.Bottom} id="success" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="failure" style={{ left: '70%' }} />
      <style jsx>{`
        /* Add styling for the node here */
      `}</style>
    </div>
  );
};

export default GoogleCalendarNode;
