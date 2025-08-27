#!/bin/bash
cd /Users/mustafaabdulkarim/Desktop/nordflytts-booking-form
npm run dev > server.log 2>&1 &
echo "Server started with PID $!"
echo "Waiting for server to be ready..."
sleep 5
echo "Testing server..."
curl -I http://localhost:3000/ || echo "Server not responding yet"
echo "Check server.log for details"