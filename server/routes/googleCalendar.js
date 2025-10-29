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

        // Get the calendar's timezone
        const calendarInfo = await calendar.calendars.get({ calendarId: settings.calendarId || 'primary' });
        const timeZone = calendarInfo.data.timeZone;


        const busyTimesResponse = await calendar.freebusy.query({
            requestBody: {
                timeMin: start.toISOString(),
                timeMax: end.toISOString(),
                timeZone: timeZone,
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

        const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };

        const isSlotAvailable = (slotStart, slotEnd) => {
            // 1. Check if it's within any availability rule
            const dayOfWeek = slotStart.getDay();
            const dayRule = availabilitySettings.find(rule => dayMap[rule.day] === dayOfWeek);

            if (!dayRule) {
                return false; // Not available on this day
            }

            const isWithinRule = dayRule.slots.some(ruleSlot => {
                const slotStartTime = slotStart.toLocaleTimeString('en-US', { hour12: false, timeZone: timeZone, hour: '2-digit', minute: '2-digit' });
                const slotEndTime = slotEnd.toLocaleTimeString('en-US', { hour12: false, timeZone: timeZone, hour: '2-digit', minute: '2-digit' });

                return slotStartTime >= ruleSlot.start && slotEndTime <= ruleSlot.end;
            });

            if (!isWithinRule) {
                return false; // Not within the defined hours for this day
            }

            // 2. Check if it overlaps with any busy times
            const isOverlapping = busyTimes.some(busy => {
                const busyStart = new Date(busy.start);
                const busyEnd = new Date(busy.end);
                return (slotStart < busyEnd && slotEnd > busyStart);
            });

            return !isOverlapping;
        };

        const requestedSlotAvailable = isSlotAvailable(requestedSlotStart, requestedSlotEnd);

        let nextAvailableSlot = null;
        if (!requestedSlotAvailable) {
            let searchStart = new Date(startDate);
            // If the requested time is in the past, start searching from now
            if (searchStart < new Date()) {
                searchStart = new Date();
            }

            // Search for the next 14 days
            for (let i = 0; i < 14; i++) {
                const dayOfWeek = searchStart.getDay();
                const dayRule = availabilitySettings.find(rule => dayMap[rule.day] === dayOfWeek);

                if (dayRule) {
                    for (const ruleSlot of dayRule.slots) {
                        const ruleStart = new Date(searchStart);
                        const [startHour, startMinute] = ruleSlot.start.split(':').map(Number);
                        ruleStart.setHours(startHour, startMinute, 0, 0);

                        const ruleEnd = new Date(searchStart);
                        const [endHour, endMinute] = ruleSlot.end.split(':').map(Number);
                        ruleEnd.setHours(endHour, endMinute, 0, 0);

                        let potentialSlotStart = new Date(Math.max(searchStart.getTime(), ruleStart.getTime()));

                        while (potentialSlotStart < ruleEnd) {
                            const potentialSlotEnd = new Date(potentialSlotStart.getTime() + meetingDuration * 60000);

                            if (potentialSlotEnd > ruleEnd) {
                                break; // Slot extends beyond the rule's end time
                            }

                            if (isSlotAvailable(potentialSlotStart, potentialSlotEnd)) {
                                nextAvailableSlot = {
                                    start: potentialSlotStart.toISOString(),
                                    end: potentialSlotEnd.toISOString(),
                                };
                                break; // Found a slot
                            }

                            // Move to the next potential slot, incrementing by 15 minutes for efficiency
                            potentialSlotStart.setTime(potentialSlotStart.getTime() + 15 * 60000);
                        }
                    }
                }
                if (nextAvailableSlot) {
                    break;
                }
                // Move to the start of the next day
                searchStart.setDate(searchStart.getDate() + 1);
                searchStart.setHours(0, 0, 0, 0);
            }
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

        const calendarInfo = await calendar.calendars.get({ calendarId: settings.calendarId || 'primary' });
        const timeZone = calendarInfo.data.timeZone;

        const event = {
            summary: summary || settings.meetingSummary || 'Meeting Scheduled by Bot',
            description,
            start: { dateTime: startTime, timeZone: timeZone },
            end: { dateTime: endTime, timeZone: timeZone },
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
