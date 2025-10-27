import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});
api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const GoogleCalendarNode = ({ data, id }) => {
  const [settings, setSettings] = useState({
    calendarId: '',
    availability: [{ day: 'Monday', slots: [{ start: '09:00', end: '17:00' }] }],
    meetingDuration: 30,
    breakTime: 15,
    meetingLocations: '', // Stored as a comma-separated string in the UI
    maxMeetingsPerDay: '',
    ...data.googleCalendar,
  });
  const [calendars, setCalendars] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Assume not authenticated initially
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchCalendars = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // This endpoint should ideally just verify the token's validity for Google Calendar access.
        // We'll use the calendar list fetch for that purpose.
        const response = await api.get('/google-calendar/calendars');

        if (response.status === 200) {
          setIsAuthenticated(true);
          setCalendars(response.data);
          if (!settings.calendarId && response.data.length > 0) {
            // Auto-select the primary calendar if none is selected
            const primary = response.data.find(cal => cal.primary);
            if (primary) {
              updateSetting('calendarId', primary.id);
            }
          }
        }
      } catch (error) {
        setIsAuthenticated(false);
        // If the error is 401/403, it means the token is invalid or expired.
        // Don't show an error, just the login prompt.
        console.error('Authentication check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchCalendars();
  }, []); // Run once on component mount

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (data.onChange) {
      // For meetingLocations, convert comma-separated string to array before saving
      if (key === 'meetingLocations') {
        data.onChange({ ...data, googleCalendar: { ...newSettings, meetingLocations: value.split(',').map(s => s.trim()).filter(Boolean) } });
      } else {
        data.onChange({ ...data, googleCalendar: newSettings });
      }
    }
  };

  const handleAvailabilityChange = (ruleIndex, field, value) => {
    const newAvailability = [...settings.availability];
    newAvailability[ruleIndex][field] = value;
    updateSetting('availability', newAvailability);
  };

  const handleSlotChange = (ruleIndex, slotIndex, field, value) => {
    const newAvailability = [...settings.availability];
    newAvailability[ruleIndex].slots[slotIndex][field] = value;
    updateSetting('availability', newAvailability);
  };

  const addSlot = (ruleIndex) => {
    const newAvailability = [...settings.availability];
    newAvailability[ruleIndex].slots.push({ start: '09:00', end: '10:00' });
    updateSetting('availability', newAvailability);
  };

  const removeSlot = (ruleIndex, slotIndex) => {
    const newAvailability = [...settings.availability];
    newAvailability[ruleIndex].slots.splice(slotIndex, 1);
    updateSetting('availability', newAvailability);
  };

  const addAvailabilityRule = () => {
    const newAvailability = [...settings.availability, { day: 'Tuesday', slots: [{ start: '09:00', end: '17:00' }] }];
    updateSetting('availability', newAvailability);
  };

  const removeAvailabilityRule = (ruleIndex) => {
    const newAvailability = [...settings.availability];
    newAvailability.splice(ruleIndex, 1);
    updateSetting('availability', newAvailability);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-lg w-64 h-auto">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400" />
      <div className="p-3 border-b border-slate-300 dark:border-slate-600">
        <h3 className="font-bold text-slate-800 dark:text-slate-200">Google Calendar</h3>
      </div>
      <div className="p-3 space-y-3 text-sm max-h-96 overflow-y-auto">
        {isLoading ? (
          <p>Loading...</p>
        ) : !isAuthenticated ? (
          <div className="text-center">
            <p className="mb-2">Please connect your Google account.</p>
            <a
              href="http://localhost:5000/api/google-calendar/auth/google"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Connect
            </a>
          </div>
        ) : (
          <>
            {/* Calendar Select */}
            <div className="space-y-1">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Calendar:</label>
              <select
                value={settings.calendarId}
                onChange={(e) => updateSetting('calendarId', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select a calendar</option>
                {calendars.map(cal => (
                  <option key={cal.id} value={cal.id}>{cal.summary}</option>
                ))}
              </select>
            </div>
            {/* Availability */}
            <div className="space-y-2">
          <label className="text-slate-600 dark:text-slate-400 font-medium">Availability:</label>
          {settings.availability.map((rule, ruleIndex) => (
            <div key={ruleIndex} className="p-2 border rounded-md space-y-2">
              {/* Day selection and remove rule button */}
              <div className="flex items-center justify-between">
                <select
                  value={rule.day}
                  onChange={(e) => handleAvailabilityChange(ruleIndex, 'day', e.target.value)}
                  className="p-1 border rounded-md"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day =>
                    <option key={day} value={day}>{day}</option>
                  )}
                </select>
                <button onClick={() => removeAvailabilityRule(ruleIndex)} className="text-red-500 hover:text-red-700">Remove</button>
              </div>
              {/* Time slots for the day */}
              {rule.slots.map((slot, slotIndex) => (
                <div key={slotIndex} className="flex items-center gap-2">
                  <input type="time" value={slot.start} onChange={(e) => handleSlotChange(ruleIndex, slotIndex, 'start', e.target.value)} className="w-full p-1 border rounded-md" />
                  <span>-</span>
                  <input type="time" value={slot.end} onChange={(e) => handleSlotChange(ruleIndex, slotIndex, 'end', e.target.value)} className="w-full p-1 border rounded-md" />
                  <button onClick={() => removeSlot(ruleIndex, slotIndex)} className="text-xs text-red-500">x</button>
                </div>
              ))}
              <button onClick={() => addSlot(ruleIndex)} className="text-sm text-blue-600 hover:text-blue-800">+ Add time slot</button>
            </div>
          ))}
          <button onClick={addAvailabilityRule} className="w-full mt-2 p-2 bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600">
            + Add Day
          </button>
        </div>
        {/* Duration & Break */}
        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
                <label>Duration (min):</label>
                <input type="number" value={settings.meetingDuration} onChange={(e) => updateSetting('meetingDuration', parseInt(e.target.value, 10))} className="w-full p-2 border rounded-md" />
            </div>
            <div className="space-y-1">
                <label>Break (min):</label>
                <input type="number" value={settings.breakTime} onChange={(e) => updateSetting('breakTime', parseInt(e.target.value, 10))} className="w-full p-2 border rounded-md" />
            </div>
        </div>
        {/* Meeting Locations */}
        <div className="space-y-1">
            <label className="text-slate-600 dark:text-slate-400 font-medium">Locations (comma-separated):</label>
            <input
                type="text"
                value={settings.meetingLocations}
                onChange={(e) => updateSetting('meetingLocations', e.target.value)}
                className="w-full p-2 border rounded-md"
            />
        </div>
        {/* Max Meetings per Day */}
        <div className="space-y-1">
            <label className="text-slate-600 dark:text-slate-400 font-medium">Max Meetings per Day (optional):</label>
            <input
                type="number"
                value={settings.maxMeetingsPerDay}
                onChange={(e) => updateSetting('maxMeetingsPerDay', parseInt(e.target.value, 10) || '')}
                min="1"
                className="w-full p-2 border rounded-md"
            />
        </div>
          </>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} id="success" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="failure" style={{ left: '70%' }} />
    </div>
  );
};

export default GoogleCalendarNode;
