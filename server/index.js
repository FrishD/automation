const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');

// Passport Config
require('./config/passport');

const app = express();
app.use(passport.initialize());
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect("mongodb://localhost/conversation-builder", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

const flowsRouter = require('./routes/api/flows');
const http = require('http');
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const Flow = require('./models/Flow');

// Use Routes
app.use('/api/flows', flowsRouter);
const googleCalendarRoutes = require('./routes/googleCalendar');
app.use('/api/google-calendar', googleCalendarRoutes);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected for simulation');

  ws.on('message', async (message) => {
    try {
      const initialMessage = JSON.parse(message);
      const { flowId, token } = initialMessage;

      const flow = await Flow.findById(flowId);

      if (!flow) {
        ws.send(JSON.stringify({ type: 'error', data: 'Flow not found' }));
        ws.close();
        return;
      }

      const flowData = flow.toObject();
      const pythonProcess = spawn('python3', ['../simulator/main.py']);

      // Pass both flow and token to the Python script
      const dataForPython = {
        flow: flowData,
        token: token,
      };

      pythonProcess.stdin.write(JSON.stringify(dataForPython));
      pythonProcess.stdin.end();

      let buffer = '';
      pythonProcess.stdout.on('data', (data) => {
        buffer += data.toString();
        const messages = buffer.split('\n');
        buffer = messages.pop(); // The last part might be incomplete, save it.

        for (const message of messages) {
          if (message.trim() === '') continue;
          try {
            // The message from python is a self-contained JSON string.
            // We don't need to parse it and re-stringify it, we can just check if it's valid
            // and forward it. The client is expecting a string anyway.
            JSON.parse(message); // This will throw if `message` is not valid JSON
            ws.send(message); // Forward the original, valid JSON string
          } catch (e) {
            console.error('Could not parse simulator output line as JSON:', message);
            // Avoid sending malformed data to the client
          }
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        ws.send(JSON.stringify({ type: 'error', data: data.toString() }));
      });

      pythonProcess.on('close', (code) => {
        ws.send(JSON.stringify({ type: 'end', data: `Simulation finished with code ${code}` }));
        ws.close();
      });

    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', data: 'Failed to start simulation' }));
      ws.close();
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from simulation');
  });
});

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
