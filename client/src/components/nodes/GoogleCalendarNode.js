import React, { useState, useEffect, useCallback } from 'react';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const updateSetting = useCallback((key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (data.onChange) {
      if (key === 'meetingLocations') {
        data.onChange({ ...data, googleCalendar: { ...newSettings, meetingLocations: value.split(',').map(s => s.trim()).filter(Boolean) } });
      } else {
        data.onChange({ ...data, googleCalendar: newSettings });
      }
    }
  }, [data, settings]);

  useEffect(() => {
    const checkAuthAndFetchCalendars = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const response = await api.get('/google-calendar/calendars');

        if (response.status === 200) {
          setIsAuthenticated(true);
          setCalendars(response.data);
          if (!settings.calendarId && response.data.length > 0) {
            const primary = response.data.find(cal => cal.primary);
            if (primary) {
              updateSetting('calendarId', primary.id);
            }
          }
        }
      } catch (error) {
        setIsAuthenticated(false);
        console.error('Authentication check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchCalendars();
  }, [settings.calendarId, updateSetting]);


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
    <div className="bg-surface-light dark:bg-surface-dark border-2 border-border-light dark:border-border-dark rounded-lg shadow-lg w-96 h-auto">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400" />
      <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">calendar_month</span>
        <h3 className="font-bold text-lg">Google Calendar</h3>
      </div>
      <div className="p-4 space-y-4 text-sm max-h-[28rem] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !isAuthenticated ? (
          <div className="text-center p-4">
            <p className="mb-4 text-muted-light dark:text-muted-dark">Please connect your Google account to schedule meetings.</p>
            <a
              href="http://localhost:5000/api/google-calendar/auth/google"
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              <span className="material-symbols-outlined">link</span>
              Connect
            </a>
          </div>
        ) : (
          <>
            {/* Calendar Select */}
            <div>
              <label className="block font-medium mb-1.5">Calendar</label>
              <select
                value={settings.calendarId}
                onChange={(e) => updateSetting('calendarId', e.target.value)}
                className="w-full p-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md"
              >
                <option value="">Select a calendar</option>
                {calendars.map(cal => (
                  <option key={cal.id} value={cal.id}>{cal.summary}</option>
                ))}
              </select>
            </div>
            {/* Availability */}
            <div>
              <label className="block font-medium mb-1.5">Availability</label>
              <div className="space-y-3">
                {settings.availability.map((rule, ruleIndex) => (
                  <div key={ruleIndex} className="p-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <select
                        value={rule.day}
                        onChange={(e) => handleAvailabilityChange(ruleIndex, 'day', e.target.value)}
                        className="p-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md"
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day =>
                          <option key={day} value={day}>{day}</option>
                        )}
                      </select>
                      <button onClick={() => removeAvailabilityRule(ruleIndex)} className="text-muted-light dark:text-muted-dark hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                    {rule.slots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex items-center gap-2">
                        <input type="time" value={slot.start} onChange={(e) => handleSlotChange(ruleIndex, slotIndex, 'start', e.target.value)} className="w-full p-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md" />
                        <span>-</span>
                        <input type="time" value={slot.end} onChange={(e) => handleSlotChange(ruleIndex, slotIndex, 'end', e.target.value)} className="w-full p-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md" />
                        <button onClick={() => removeSlot(ruleIndex, slotIndex)} className="text-muted-light dark:text-muted-dark hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addSlot(ruleIndex)} className="text-sm text-primary hover:underline">+ Add time slot</button>
                  </div>
                ))}
                <button onClick={addAvailabilityRule} className="w-full mt-2 p-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md hover:bg-opacity-70 transition-colors">
                  + Add Day
                </button>
              </div>
            </div>
             {/* Duration & Break */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1.5">Duration (min)</label>
                <input type="number" value={settings.meetingDuration} onChange={(e) => updateSetting('meetingDuration', parseInt(e.target.value, 10))} className="w-full p-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md" />
              </div>
              <div>
                <label className="block font-medium mb-1.5">Break (min)</label>
                <input type="number" value={settings.breakTime} onChange={(e) => updateSetting('breakTime', parseInt(e.target.value, 10))} className="w-full p-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md" />
              </div>
            </div>
            {/* Meeting Locations */}
            <div>
              <label className="block font-medium mb-1.5">Locations (comma-separated)</label>
              <input
                  type="text"
                  value={settings.meetingLocations}
                  onChange={(e) => updateSetting('meetingLocations', e.target.value)}
                  className="w-full p-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md"
              />
            </div>
            {/* Max Meetings per Day */}
            <div>
              <label className="block font-medium mb-1.5">Max Meetings per Day (optional)</label>
              <input
                  type="number"
                  value={settings.maxMeetingsPerDay}
                  onChange={(e) => updateSetting('maxMeetingsPerDay', parseInt(e.target.value, 10) || '')}
                  min="1"
                  className="w-full p-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md"
              />
            </div>
          </>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} id="success" className="w-3 h-3" style={{ left: '30%', backgroundColor: '#22c55e' }} />
      <Handle type="source" position={Position.Bottom} id="failure" className="w-3 h-3" style={{ left: '70%', backgroundColor: '#ef4444' }} />
    </div>
  );
};

export default GoogleCalendarNode;
