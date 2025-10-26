import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import axios from 'axios';

// ... (api setup remains the same)

const GoogleCalendarNode = ({ data, id }) => {
  // ... (state and useEffect remain the same)

  const updateSetting = (key, value) => {
    // ... (implementation remains the same)
  };

  return (
    <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-lg w-64 h-auto">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400" />
      <div className="p-3 border-b border-slate-300 dark:border-slate-600">
        <h3 className="font-bold text-slate-800 dark:text-slate-200">Google Calendar</h3>
      </div>
      <div className="p-3 space-y-3 text-sm max-h-96 overflow-y-auto">
        {/* All the form fields go here, same as before */}
        <div className="space-y-1">
          <label className="text-slate-600 dark:text-slate-400 font-medium">Calendar:</label>
          <select
            value={settings.calendarId}
            onChange={(e) => updateSetting('calendarId', e.target.value)}
            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Select a Calendar</option>
            {calendars.map((cal) => (
              <option key={cal.id} value={cal.id}>
                {cal.summary}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
            <label className="text-slate-600 dark:text-slate-400 font-medium">Availability:</label>
            <div className="flex items-center gap-2">
                <input
                    type="time"
                    value={settings.startTime}
                    onChange={(e) => updateSetting('startTime', e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700"
                />
                <span className="text-slate-500 dark:text-slate-400">-</span>
                <input
                    type="time"
                    value={settings.endTime}
                    onChange={(e) => updateSetting('endTime', e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700"
                />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400 font-medium">Duration (min):</label>
                <input
                    type="number"
                    value={settings.meetingDuration}
                    onChange={(e) => updateSetting('meetingDuration', parseInt(e.target.value, 10))}
                    min="1"
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700"
                />
            </div>
            <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400 font-medium">Break (min):</label>
                <input
                    type="number"
                    value={settings.breakTime}
                    onChange={(e) => updateSetting('breakTime', parseInt(e.target.value, 10))}
                    min="0"
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700"
                />
            </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="success" style={{ left: '30%' }} className="w-3 h-3 bg-green-500" />
      <Handle type="source" position={Position.Bottom} id="failure" style={{ left: '70%' }} className="w-3 h-3 bg-red-500" />
    </div>
  );
};

export default GoogleCalendarNode;
