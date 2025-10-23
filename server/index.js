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

  ws.on('message', async (message) => {
    try {
      const { flowId } = JSON.parse(message);
      const flow = await Flow.findById(flowId);

      if (!flow) {
        ws.send(JSON.stringify({ type: 'error', data: 'Flow not found' }));
        ws.close();
        return;
      }

      const flowData = flow.toObject();
      const pythonProcess = spawn('python3', ['../simulator/main.py']);

      pythonProcess.stdin.write(JSON.stringify(flowData));
      pythonProcess.stdin.end();

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        try {
          // Check if the output is the JSON for active_node
          const jsonData = JSON.parse(output);
          if (jsonData.type === 'active_node') {
            ws.send(JSON.stringify(jsonData));
          }
        } catch (e) {
          // If it's not JSON, it's a regular log
          ws.send(JSON.stringify({ type: 'log', data: output }));
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
