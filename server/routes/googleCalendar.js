const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const User = require('../models/User');
const Flow = require('../models/Flow');

// --- Authentication Routes ---
router.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly'],
    accessType: 'offline',
    prompt: 'consent'
}));

router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/', session: false }), (req, res) => {
    const user = req.user;
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
});

// --- Middleware & Helpers ---
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) return res.sendStatus(403);
            try {
                const user = await User.findById(decoded.id);
                if (!user) return res.sendStatus(401);
                req.user = user;
                next();
            } catch (dbError) {
                res.status(500).send('Database error.');
            }
        });
    } else {
        res.sendStatus(401);
    }
};

const getOAuth2Client = (user) => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL
    );
    oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken
    });
    return oauth2Client;
};

// --- API Endpoints ---
router.get('/calendars', authenticateJWT, async (req, res) => {
    try {
        const oauth2Client = getOAuth2Client(req.user);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const response = await calendar.calendarList.list();
        res.json(response.data.items);
    } catch (error) {
        res.status(500).send('Failed to fetch calendar list.');
    }
});

router.post('/availability', authenticateJWT, async (req, res) => {
    const { flowId, nodeId, startDate } = req.body;
    try {
        const flow = await Flow.findById(flowId);
        if (!flow) return res.status(404).send('Flow not found.');

        const activeNode = flow.nodes.find(n => n.id === nodeId);
        if (!activeNode || !activeNode.data || !activeNode.data.googleCalendar) {
            return res.status(404).send('Google Calendar node settings not found in the active node.');
        }

        const settings = activeNode.data.googleCalendar;
        const oauth2Client = getOAuth2Client(req.user);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        const busyTimesResponse = await calendar.freebusy.query({
            requestBody: {
                timeMin: start.toISOString(),
                timeMax: end.toISOString(),
                items: [{ id: settings.calendarId || 'primary' }],
            },
        });

        const busyTimes = busyTimesResponse.data.calendars[settings.calendarId || 'primary'].busy;
        const { meetingDuration, breakTime } = settings;
        const availabilitySettings = settings.availability || [];

        if (!meetingDuration || availabilitySettings.length === 0) {
            return res.status(400).send('Missing required calendar availability settings.');
        }

        const requestedSlotStart = new Date(startDate);
        const requestedSlotEnd = new Date(requestedSlotStart.getTime() + meetingDuration * 60000);

        let requestedSlotAvailable = false;
        let nextAvailableSlot = null;

        // Check if the requested slot is within the defined availability and not busy
        const requestedDayName = requestedSlotStart.toLocaleString('en-US', { weekday: 'long' });
        const daySettingForRequested = availabilitySettings.find(s => s.day === requestedDayName);

        if (daySettingForRequested) {
            const isInAvailableSlot = daySettingForRequested.slots.some(slot => {
                const slotStart = new Date(requestedSlotStart);
                const [startHour, startMinute] = slot.start.split(':').map(Number);
                slotStart.setHours(startHour, startMinute, 0, 0);

                const slotEnd = new Date(requestedSlotStart);
                const [endHour, endMinute] = slot.end.split(':').map(Number);
                slotEnd.setHours(endHour, endMinute, 0, 0);

                return requestedSlotStart >= slotStart && requestedSlotEnd <= slotEnd;
            });

            const isOverlapping = busyTimes.some(busy => {
                const busyStart = new Date(busy.start);
                const busyEnd = new Date(busy.end);
                return (requestedSlotStart < busyEnd && requestedSlotEnd > busyStart);
            });

            if (isInAvailableSlot && !isOverlapping) {
                requestedSlotAvailable = true;
            }
        }

        // Find the next available slot starting from the requested time
        let searchDate = new Date(startDate);

        for (let i = 0; i < 7 && !nextAvailableSlot; i++) { // Search up to 7 days
            const dayName = searchDate.toLocaleString('en-US', { weekday: 'long' });
            const daySetting = availabilitySettings.find(s => s.day === dayName);

            if (daySetting) {
                for (const slot of daySetting.slots) {
                    let currentSlotStart = new Date(searchDate);
                    const [startHour, startMinute] = slot.start.split(':').map(Number);
                    currentSlotStart.setHours(startHour, startMinute, 0, 0);

                    const dayEnd = new Date(searchDate);
                    const [endHour, endMinute] = slot.end.split(':').map(Number);
                    dayEnd.setHours(endHour, endMinute, 0, 0);

                    // If it's the first day, start searching from the requested time
                    if(i === 0 && currentSlotStart < requestedSlotStart) {
                        currentSlotStart = requestedSlotStart;
                    }

                    while (currentSlotStart < dayEnd) {
                        const currentSlotEnd = new Date(currentSlotStart.getTime() + meetingDuration * 60000);
                        if (currentSlotEnd > dayEnd) break;

                        const isOverlapping = busyTimes.some(busy => {
                            const busyStart = new Date(busy.start).getTime() - (breakTime || 0) * 60000;
                            const busyEnd = new Date(busy.end).getTime() + (breakTime || 0) * 60000;
                            const currentStart = currentSlotStart.getTime();
                            const currentEnd = currentSlotEnd.getTime();
                            return (currentStart < busyEnd && currentEnd > busyStart);
                        });

                        if (!isOverlapping) {
                            nextAvailableSlot = { start: currentSlotStart.toISOString(), end: currentSlotEnd.toISOString() };
                            break; // Exit the while loop
                        }
                        currentSlotStart.setTime(currentSlotEnd.getTime() + (breakTime || 0) * 60000);
                    }
                    if (nextAvailableSlot) break; // Exit the slot loop
                }
            }
            if (nextAvailableSlot) break; // Exit the day loop
            searchDate.setDate(searchDate.getDate() + 1);
            searchDate.setHours(0,0,0,0); // Start search from the beginning of the next day
        }

        res.json({
            requestedSlotAvailable,
            nextAvailableSlot
        });
    } catch (error) {
        res.status(500).send('Failed to calculate availability.');
    }
});

router.post('/create-event', authenticateJWT, async (req, res) => {
    const { flowId, nodeId, startTime, endTime, summary, description, attendees } = req.body;
    try {
        const flow = await Flow.findById(flowId);
        if (!flow) return res.status(404).send('Flow not found.');

        const activeNode = flow.nodes.find(n => n.id === nodeId);
        if (!activeNode || !activeNode.data || !activeNode.data.googleCalendar) {
            return res.status(404).send('Google Calendar node settings not found.');
        }
        const settings = activeNode.data.googleCalendar;

        const oauth2Client = getOAuth2Client(req.user);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const event = {
            summary: summary || settings.meetingSummary || 'Meeting Scheduled by Bot',
            description,
            start: { dateTime: startTime, timeZone: 'America/Los_Angeles' }, // Should be dynamic
            end: { dateTime: endTime, timeZone: 'America/Los_Angeles' },   // Should be dynamic
            attendees: attendees ? attendees.filter(e => e).map(email => ({ email })) : [],
        };

        const response = await calendar.events.insert({
            calendarId: settings.calendarId || 'primary',
            resource: event,
        });
        res.status(201).json(response.data);
    } catch (error) {
        res.status(500).send('Failed to create event.');
    }
});

module.exports = router;
