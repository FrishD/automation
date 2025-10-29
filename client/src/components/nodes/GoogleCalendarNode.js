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
        <div className="bg-white rounded-lg shadow-lg border border-shadow-depth w-96 text-dark-text">
            <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-accent" />

            <div className="p-4 border-b border-shadow-depth flex items-center gap-3 bg-secondary-background rounded-t-lg">
                <span className="material-symbols-outlined text-primary">calendar_month</span>
                <h3 className="font-bold text-lg text-dark-text">Google Calendar</h3>
            </div>

            <div className="p-5 space-y-5 text-sm max-h-96 overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                ) : !isAuthenticated ? (
                    <div className="text-center p-5">
                        <p className="mb-4 text-muted-gray">Please connect your Google account to schedule meetings.</p>
                        <a
                            href="http://localhost:5000/api/google-calendar/auth/google"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-gradient-end transition-all"
                        >
                            <span className="material-symbols-outlined">link</span>
                            Connect Account
                        </a>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <label className="block font-semibold text-dark-text mb-1">Language</label>
                            <select value={settings.language || 'en'} onChange={(e) => updateSetting('language', e.target.value)} className="nodrag w-full p-2.5 border border-shadow-depth rounded-md bg-white focus:ring-2 focus:ring-primary focus:border-primary transition">
                                <option value="en">English</option>
                                <option value="he">עברית</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block font-semibold text-dark-text mb-1">Calendar to use</label>
                            <select value={settings.calendarId} onChange={(e) => updateSetting('calendarId', e.target.value)} className="nodrag w-full p-2.5 border border-shadow-depth rounded-md bg-white focus:ring-2 focus:ring-primary focus:border-primary transition">
                                <option value="">Select a calendar</option>
                                {calendars.map(cal => <option key={cal.id} value={cal.id}>{cal.summary}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block font-semibold text-dark-text mb-1">Meeting Name</label>
                            <input type="text" value={settings.meetingSummary || ''} onChange={(e) => updateSetting('meetingSummary', e.target.value)} placeholder="e.g., Introduction Call" className="nodrag w-full p-2.5 border border-shadow-depth rounded-md bg-white focus:ring-2 focus:ring-primary focus:border-primary transition" />
                        </div>

                        <div>
                            <label className="block font-semibold text-dark-text mb-2">Availability Rules</label>
                            <div className="space-y-3">
                                {settings.availability.map((rule, ruleIndex) => (
                                    <div key={ruleIndex} className="p-3.5 bg-secondary-background border border-shadow-depth rounded-lg space-y-3">
                                        <div className="flex items-center justify-between">
                                            <select value={rule.day} onChange={(e) => handleAvailabilityChange(ruleIndex, 'day', e.target.value)} className="nodrag p-2 border border-shadow-depth rounded-md bg-white focus:ring-2 focus:ring-primary">
                                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => <option key={day} value={day}>{day}</option>)}
                                            </select>
                                            <button onClick={() => removeAvailabilityRule(ruleIndex)} className="text-muted-gray hover:text-red-500 transition-colors">
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                        {rule.slots.map((slot, slotIndex) => (
                                            <div key={slotIndex} className="flex items-center gap-2">
                                                <input type="time" value={slot.start} onChange={(e) => handleSlotChange(ruleIndex, slotIndex, 'start', e.target.value)} className="nodrag w-full p-2 border border-shadow-depth rounded-md bg-white focus:ring-2 focus:ring-primary" />
                                                <span className="text-muted-gray">-</span>
                                                <input type="time" value={slot.end} onChange={(e) => handleSlotChange(ruleIndex, slotIndex, 'end', e.target.value)} className="nodrag w-full p-2 border border-shadow-depth rounded-md bg-white focus:ring-2 focus:ring-primary" />
                                                <button onClick={() => removeSlot(ruleIndex, slotIndex)} className="text-muted-gray hover:text-red-500 transition-colors">
                                                    <span className="material-symbols-outlined text-base">close</span>
                                                </button>
                                            </div>
                                        ))}
                                        <button onClick={() => addSlot(ruleIndex)} className="text-sm font-semibold text-primary hover:underline">+ Add time slot</button>
                                    </div>
                                ))}
                                <button onClick={addAvailabilityRule} className="w-full mt-2 py-2.5 bg-white border-2 border-dashed border-shadow-depth rounded-lg text-muted-gray hover:bg-secondary-background hover:text-primary transition-all">
                                    + Add Day
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block font-semibold">Duration (min)</label>
                                <input type="number" value={settings.meetingDuration} onChange={(e) => updateSetting('meetingDuration', parseInt(e.target.value, 10))} className="nodrag w-full p-2.5 border border-shadow-depth rounded-md bg-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="block font-semibold">Break (min)</label>
                                <input type="number" value={settings.breakTime} onChange={(e) => updateSetting('breakTime', parseInt(e.target.value, 10))} className="nodrag w-full p-2.5 border border-shadow-depth rounded-md bg-white" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block font-semibold text-dark-text mb-1">Locations (comma-separated)</label>
                            <input type="text" value={settings.meetingLocations} onChange={(e) => updateSetting('meetingLocations', e.target.value)} placeholder="e.g., Office, Google Meet" className="nodrag w-full p-2.5 border border-shadow-depth rounded-md bg-white" />
                        </div>

                        <div className="space-y-2">
                            <label className="block font-semibold text-dark-text mb-1">Max Meetings per Day</label>
                            <input type="number" value={settings.maxMeetingsPerDay} onChange={(e) => updateSetting('maxMeetingsPerDay', parseInt(e.target.value, 10) || '')} min="1" className="nodrag w-full p-2.5 border border-shadow-depth rounded-md bg-white" />
                        </div>
                    </>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} id="success" className="w-3 h-3 !bg-green-500" style={{ left: '30%' }} />
            <Handle type="source" position={Position.Bottom} id="failure" className="w-3 h-3 !bg-red-500" style={{ left: '70%' }} />
        </div>
    );
};

export default GoogleCalendarNode;
