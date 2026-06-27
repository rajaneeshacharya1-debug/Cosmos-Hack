AURALIS BEACON FOUNDATION V2.4

Purpose:
This build fixes the cramped tracker page and moves the interface closer to the final unified app design.

What changed from V2.0:
- Collapsible 3-line sidebar menu.
- Track page layout modes: Desktop, Compact, and Phone Preview.
- Compact tracker layout to make the map/control area easier to use on laptop screens.
- Phone Preview mode to design the Android app layout while still using the same web prototype.
- API URLs are now collapsed inside an Integration drawer instead of permanently taking space.
- More mobile-friendly bottom navigation.
- Cleaner command panel spacing and smaller tracker cards.

Run:
  cd /d "E:\auralis_foundation_v2_1"
  node server.js

Open:
  http://localhost:8800

Demo login:
  owner@auralis.local
  Auralis@4729

Agent simulator:
  http://localhost:8800/agent.html

Public tunnel for this version:
  "E:\cloudflared-windows-amd64.exe" tunnel --url http://localhost:8800

Important:
- V2.1 uses port 8800 so it can run separately from V2.0.
- The sidebar collapse and tracker layout choice are saved in browser localStorage.
- For actual MacroDroid testing, update the base URL after starting the new tunnel.


V2.4 changes:
- Improved responsive layout for desktop, compact laptop, mobile portrait and mobile landscape.
- Login page redesigned with a mobile app preview.
- Track page simplified to demo-safe recovery controls: Resume, Ring, Normal/Power Save tracking, Stop.
- Removed visible duplicate commands like manual status/location because location, battery and status already refresh automatically.
- Added in-app note explaining that web/PWA is excellent for dashboard/tracker UI but cannot replace a native Android agent for background SMS/device-control work.
- Keeps port 8800 for the stable ngrok URL: https://barbecue-fog-boots.ngrok-free.dev


V2.4:
- Restored the original desktop tracker structure: selected device | map | recovery controls side by side.
- Kept Compact mode as a different layout, not identical to Desktop.
- Rebuilt Phone preview so it stays one-column and no longer collapses into a broken sliver.
- Added fullscreen map mode.
- Removed the duplicate tracker-layout bar and the planning-only "Why fewer commands?" box.
- Improved real mobile login and tracker layout across portrait and landscape.
- Fixed the collapsed protected badge styling.