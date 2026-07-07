#!/bin/bash
# DocuMorph - Auto Startup Script
# Keeps the server and tunnel running, restarts if they crash

PROJECT_DIR="/home/abhiram/Project/AI_Agent/documorph"
PID_FILE="/tmp/documorph_pids.txt"

echo "🚀 Starting DocuMorph..."

# Kill any existing instances
pkill -f "node api/index" 2>/dev/null
pkill -f "localhost.run" 2>/dev/null

# Start Node server
cd "$PROJECT_DIR"
PORT=3000 nohup node api/index.js > /tmp/documorph-server.log 2>&1 &
echo "server_pid=$!" > "$PID_FILE"
echo "Server PID: $!"

# Wait for server
sleep 2

# Start SSH tunnel
nohup ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:localhost:3000 nokey@localhost.run > /tmp/documorph-tunnel.log 2>&1 &
echo "tunnel_pid=$!" >> "$PID_FILE"
echo "Tunnel PID: $!"

sleep 5

# Get tunnel URL
TUNNEL_URL=$(grep -o 'https://[a-z0-9]*\.lhr\.life' /tmp/documorph-tunnel.log | head -1)
echo "🌐 Public URL: $TUNNEL_URL"
echo "URL=$TUNNEL_URL" >> "$PID_FILE"

# Test
curl -s "$TUNNEL_URL/api/health" && echo "✅ Health check passed!"
echo ""
echo "📋 To check logs:"
echo "  Server: tail -f /tmp/documorph-server.log"
echo "  Tunnel: tail -f /tmp/documorph-tunnel.log"
echo "📋 To stop: kill \$(cat $PID_FILE)"
