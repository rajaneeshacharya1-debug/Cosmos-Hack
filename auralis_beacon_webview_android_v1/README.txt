Auralis Beacon WebView Android App V1
=====================================

Purpose
-------
This is a fast fallback Android WebView app for hackathon presentation.
It wraps the Auralis Beacon web dashboard in a native Android shell.

It is NOT the final native recovery agent yet.
The final app will later replace MacroDroid with native services.

Current URL
-----------
https://barbecue-fog-boots.ngrok-free.dev

Demo login
----------
owner@auralis.local
Auralis@4729

How to run
----------
1. Start your web server:
   cd /d "E:\auralis_foundation_v2_28"
   node server.js

2. Start ngrok:
   ngrok http --url=barbecue-fog-boots.ngrok-free.dev 8800

3. Open this Android project in Android Studio.

4. Connect Android phone with USB debugging enabled.

5. Press Run.

Permissions
-----------
The app requests:
- Internet
- Network state
- Fine/coarse location

Why location?
-------------
WebView location permission allows the web dashboard/geolocation features to work inside the app shell.

What this app does
------------------
- Opens Auralis Beacon as a full-screen app
- Shows native Auralis splash/loading screen
- Enables JavaScript, local storage and geolocation in WebView
- Supports WebView audio playback
- Shows retry screen if server/ngrok is not reachable
- Supports Android back button navigation

What this app does not do yet
-----------------------------
- It does not replace MacroDroid yet
- It does not run a native foreground recovery service yet
- It does not receive SMS commands natively yet
- It does not poll commands natively yet

Next real app phase
-------------------
Replace MacroDroid with:
- Foreground Recovery Service
- Native Location Streamer
- Native Command Poller
- Native Ring Controller
- Native SMS ignition receiver
