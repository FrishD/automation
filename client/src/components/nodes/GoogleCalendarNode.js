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
    startTime: '09:00',
    endTime: '17:00',
    meetingDuration: 30,
    breakTime: 15,
    meetingLocations: '', // Stored as a comma-separated string in the UI
    maxMeetingsPerDay: '',
    ...data.googleCalendar,
  });
  const [calendars, setCalendars] = useState([]);

  useEffect(() => {
    // Fetch calendars logic...
  }, [settings.calendarId]);

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

  return (
    <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-lg w-64 h-auto">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400" />
      <div className="p-3 border-b border-slate-300 dark:border-slate-600">
        <h3 className="font-bold text-slate-800 dark:text-slate-200">Google Calendar</h3>
      </div>
      <div className="p-3 space-y-3 text-sm max-h-96 overflow-y-auto">
        {/* Calendar Select */}
        <div className="space-y-1">
          <label className="text-slate-600 dark:text-slate-400 font-medium">Calendar:</label>
          <select value={settings.calendarId} onChange={(e) => updateSetting('calendarId', e.target.value)} className="w-full p-2 border rounded-md" >
            {/* options */}
          </select>
        </div>
        {/* Availability */}
        <div className="space-y-1">
            <label className="text-slate-600 dark:text-slate-400 font-medium">Availability:</label>
            <div className="flex items-center gap-2">
                <input type="time" value={settings.startTime} onChange={(e) => updateSetting('startTime', e.target.value)} className="w-full p-2 border rounded-md" />
                <span>-</span>
                <input type="time" value={settings.endTime} onChange={(e) => updateSetting('endTime', e.target.value)} className="w-full p-2 border rounded-md" />
            </div>
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
      </div>
      <Handle type="source" position={Position.Bottom} id="success" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="failure" style={{ left: '70%' }} />
    </div>
  );
};

export default GoogleCalendarNode;
