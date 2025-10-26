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

  const cleanup = () => {
    if (pythonProcess && !pythonProcess.killed) {
      pythonProcess.kill();
    }
    pythonProcess = null;
    console.log('Cleaned up python process.');
  };

  ws.on('message', async (message) => {
    // Check if the message is binary audio data
    if (message instanceof Buffer) {
      if (pythonProcess && pythonProcess.stdin.writable) {
        const lengthHeader = Buffer.from(message.length.toString() + '\n');
        pythonProcess.stdin.write(lengthHeader);
        pythonProcess.stdin.write(message);
      }
      return;
    }

    // Handle JSON messages
    try {
      const parsedMessage = JSON.parse(message);

      if (parsedMessage.type === 'start_simulation') {
        const { flowId } = parsedMessage;
        const flow = await Flow.findById(flowId);

        if (!flow) {
          ws.send(JSON.stringify({ type: 'error', data: 'Flow not found' }));
          return;
        }

        const flowData = flow.toObject();

        pythonProcess = spawn('python3', ['../simulator/main.py']);

        const flowString = JSON.stringify(flowData) + '\n';
        pythonProcess.stdin.write(flowString);

        pythonProcess.stdout.on('data', (data) => {
          const dataStr = data.toString();
          const messages = dataStr.split('\n').filter(m => m.trim() !== '');
          messages.forEach(msg => {
            try {
              JSON.parse(msg); // Validate JSON
              ws.send(msg);
            } catch (e) {
              console.error('Could not parse simulator output as JSON:', msg);
            }
          });
        });

        pythonProcess.stderr.on('data', (data) => {
          ws.send(JSON.stringify({ type: 'error', data: data.toString() }));
        });

        pythonProcess.on('close', (code) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'end', data: `Simulation finished with code ${code}` }));
          }
          cleanup();
        });
      }
    } catch (error) {
      console.error("Error processing message:", error);
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'error', data: 'Failed to process message' }));
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from simulation');
    cleanup();
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    cleanup();
  });
});

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
