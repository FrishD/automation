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
    console.log('--- Availability Check Started ---');
    console.log(`Request Body: flowId=${flowId}, nodeId=${nodeId}, startDate=${startDate}`);

    try {
        const flow = await Flow.findById(flowId);
        if (!flow) {
            console.error('Flow not found.');
            return res.status(404).send('Flow not found.');
        }

        const activeNode = flow.nodes.find(n => n.id === nodeId);
        if (!activeNode || !activeNode.data || !activeNode.data.googleCalendar) {
            console.error('Google Calendar node settings not found.');
            return res.status(404).send('Google Calendar node settings not found in the active node.');
        }

        const settings = activeNode.data.googleCalendar;
        console.log('Calendar Settings:', JSON.stringify(settings, null, 2));

        const oauth2Client = getOAuth2Client(req.user);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        const calendarInfo = await calendar.calendars.get({ calendarId: settings.calendarId || 'primary' });
        const timeZone = calendarInfo.data.timeZone;
        console.log(`Calendar Timezone: ${timeZone}`);

        const busyTimesResponse = await calendar.freebusy.query({
            requestBody: {
                timeMin: start.toISOString(),
                timeMax: end.toISOString(),
                timeZone: timeZone,
                items: [{ id: settings.calendarId || 'primary' }],
            },
        });

        const busyTimes = busyTimesResponse.data.calendars[settings.calendarId || 'primary'].busy;
        console.log('Busy Times from Google:', JSON.stringify(busyTimes, null, 2));

        const { meetingDuration, breakTime } = settings;
        const availabilitySettings = settings.availability || [];

        if (!meetingDuration || availabilitySettings.length === 0) {
            console.error('Missing calendar availability settings.');
            return res.status(400).send('Missing required calendar availability settings.');
        }

        const requestedSlotStart = new Date(startDate);
        const requestedSlotEnd = new Date(requestedSlotStart.getTime() + meetingDuration * 60000);
        console.log(`Requested Slot: ${requestedSlotStart.toISOString()} to ${requestedSlotEnd.toISOString()}`);

        const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };

        const getDayInTimezone = (date, tz) => {
            const dayName = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(date);
            return dayMap[dayName];
        };

        const getTimeStringInTimezone = (date, tz) => {
            return date.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
        };

        const isSlotAvailable = (slotStart, slotEnd) => {
            console.log(`\nChecking slot: ${slotStart.toISOString()} to ${slotEnd.toISOString()}`);

            const dayOfWeekInTZ = getDayInTimezone(slotStart, timeZone);
            const dayRule = availabilitySettings.find(rule => dayMap[rule.day] === dayOfWeekInTZ);
            console.log(`Day of week in TZ (${timeZone}): ${dayOfWeekInTZ}, Found Rule:`, dayRule ? JSON.stringify(dayRule) : 'None');
            if (!dayRule) return false;

            const slotStartTimeStr = getTimeStringInTimezone(slotStart, timeZone);
            const slotEndTimeStr = getTimeStringInTimezone(slotEnd, timeZone);
            console.log(`Slot time in TZ (${timeZone}): ${slotStartTimeStr} - ${slotEndTimeStr}`);

            const isWithinRule = dayRule.slots.some(ruleSlot => {
                const check = slotStartTimeStr >= ruleSlot.start && slotEndTimeStr <= ruleSlot.end;
                console.log(`  - Checking against rule slot ${ruleSlot.start}-${ruleSlot.end}: ${check}`);
                return check;
            });
            console.log(`Is within any rule slot? ${isWithinRule}`);
            if (!isWithinRule) return false;

            const isOverlapping = busyTimes.some(busy => {
                const busyStart = new Date(busy.start);
                const busyEnd = new Date(busy.end);
                const overlap = (slotStart < busyEnd && slotEnd > busyStart);
                if (overlap) console.log(`  - Overlaps with busy slot: ${busy.start} - ${busy.end}`);
                return overlap;
            });
            console.log(`Is overlapping with a busy slot? ${isOverlapping}`);

            const isAvailable = !isOverlapping;
            console.log(`Slot is available? ${isAvailable}`);
            return isAvailable;
        };

        const requestedSlotAvailable = isSlotAvailable(requestedSlotStart, requestedSlotEnd);

        let nextAvailableSlot = null;
        if (!requestedSlotAvailable) {
            // Start searching from the requested date, or from now if the request is in the past.
            let potentialSlotStart = new Date(startDate);
            if (potentialSlotStart < new Date()) {
                potentialSlotStart = new Date();
            }

            // Round up to the next 15-minute interval to avoid suggesting a time that's just passed.
            const minutes = potentialSlotStart.getMinutes();
            potentialSlotStart.setMinutes(Math.ceil(minutes / 15) * 15, 0, 0);

            const searchLimit = new Date(potentialSlotStart);
            searchLimit.setDate(searchLimit.getDate() + 14); // Search for the next 14 days.

            // Iterate through time and test each slot until we find one that is available.
            while (potentialSlotStart < searchLimit) {
                const potentialSlotEnd = new Date(potentialSlotStart.getTime() + meetingDuration * 60000);

                if (isSlotAvailable(potentialSlotStart, potentialSlotEnd)) {
                    nextAvailableSlot = {
                        start: potentialSlotStart.toISOString(),
                        end: potentialSlotEnd.toISOString(),
                    };
                    break; // Found a valid slot.
                }

                // Move to the next potential slot, using the break time as the increment.
                const increment = (breakTime || 15) * 60000;
                potentialSlotStart.setTime(potentialSlotStart.getTime() + increment);
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
    // The simulator will now only send the essential, confirmed details.
    const { flowId, nodeId, startTime, endTime, attendees } = req.body;
    console.log('\n--- Create Event Started (Server-Side Logic) ---');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    try {
        const flow = await Flow.findById(flowId);
        if (!flow) {
            console.error('Flow not found for event creation.');
            return res.status(404).send('Flow not found.');
        }

        const activeNode = flow.nodes.find(n => n.id === nodeId);
        if (!activeNode || !activeNode.data || !activeNode.data.googleCalendar) {
            console.error('Node settings not found for event creation.');
            return res.status(404).send('Google Calendar node settings not found.');
        }
        const settings = activeNode.data.googleCalendar;
        console.log('Using Calendar Settings from Node:', JSON.stringify(settings, null, 2));

        // The server is now responsible for gathering the summary and description from the node's settings.
        const summary = settings.meetingSummary || 'Meeting Scheduled by Bot';
        const description = settings.meetingDescription || 'Scheduled via automated assistant.';

        const oauth2Client = getOAuth2Client(req.user);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const calendarInfo = await calendar.calendars.get({ calendarId: settings.calendarId || 'primary' });
        const timeZone = calendarInfo.data.timeZone;
        console.log(`Target Calendar Timezone: ${timeZone}`);

        const event = {
            summary,
            description,
            start: { dateTime: startTime, timeZone: timeZone },
            end: { dateTime: endTime, timeZone: timeZone },
            attendees: attendees ? attendees.filter(email => email).map(email => ({ email })) : [],
        };
        console.log('Event Resource to be created:', JSON.stringify(event, null, 2));

        const response = await calendar.events.insert({
            calendarId: settings.calendarId || 'primary',
            resource: event,
        });
        console.log('Successfully created event:', response.data.htmlLink);
        res.status(201).json(response.data);
    } catch (error) {
        console.error('--- ERROR CREATING EVENT ---');
        console.error('Error Status:', error.response ? error.response.status : 'N/A');
        console.error('Error Body:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        console.error('Stack Trace:', error.stack);
        res.status(500).send('Failed to create event.');
    }
});

module.exports = router;