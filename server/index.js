const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost/conversation-builder', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

const flowsRouter = require('./routes/api/flows');
const http = require('http');
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const Flow = require('./models/Flow');

// Use Routes
app.use('/api/flows', flowsRouter);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected for simulation');
  let pythonProcess = null;

  ws.on('message', async (message) => {
    // If the message is a string, it's our initial JSON command
    if (typeof message === 'string' || message instanceof String) {
        try {
            const data = JSON.parse(message);
            if (data.type === 'start_simulation' && data.flowId) {
                const flow = await Flow.findById(data.flowId);
                if (!flow) {
                    ws.send(JSON.stringify({ type: 'error', data: 'Flow not found' }));
                    ws.close();
                    return;
                }

                const flowData = flow.toObject();
                pythonProcess = spawn('python3', ['../simulator/main.py']);

                // Handle stdout from Python script
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
                    console.error(`Python stderr: ${data}`);
                    ws.send(JSON.stringify({ type: 'error', data: data.toString() }));
                });

                pythonProcess.on('close', (code) => {
                    console.log(`Python process exited with code ${code}`);
                    ws.send(JSON.stringify({ type: 'end', data: `Simulation finished with code ${code}` }));
                    ws.close();
                });

                // Send flow data as a single line, followed by a newline to signal end of initial data
                pythonProcess.stdin.write(JSON.stringify(flowData) + '\\n');
            }
        } catch (error) {
            console.error('Failed to process incoming message:', error);
            ws.send(JSON.stringify({ type: 'error', data: 'Invalid message format' }));
        }
    // If the message is binary data, it's our audio blob
    } else if (message instanceof Buffer) {
        if (pythonProcess && pythonProcess.stdin.writable) {
            // Forward the audio data to the Python script's stdin
            pythonProcess.stdin.write(message);
            // DO NOT end stdin here; the script might need to listen again.
        }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from simulation');
  });
});

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
