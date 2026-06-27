AURALIS BEACON FOUNDATION V2.10

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


V2.10 changes:
- Improved responsive layout for desktop, compact laptop, mobile portrait and mobile landscape.
- Login page redesigned with a mobile app preview.
- Track page simplified to demo-safe recovery controls: Resume, Ring, Normal/Power Save tracking, Stop.
- Removed visible duplicate commands like manual status/location because location, battery and status already refresh automatically.
- Added in-app note explaining that web/PWA is excellent for dashboard/tracker UI but cannot replace a native Android agent for background SMS/device-control work.
- Keeps port 8800 for the stable ngrok URL: https://barbecue-fog-boots.ngrok-free.dev


V2.10:
- Restored the original desktop tracker structure: selected device | map | recovery controls side by side.
- Kept Compact mode as a different layout, not identical to Desktop.
- Rebuilt Phone preview so it stays one-column and no longer collapses into a broken sliver.
- Added fullscreen map mode.
- Removed the duplicate tracker-layout bar and the planning-only "Why fewer commands?" box.
- Improved real mobile login and tracker layout across portrait and landscape.
- Fixed the collapsed protected badge styling.

V2.10:
- Fixed phone-browser bug where the login section stayed visible over dashboard pages after login.
- Added stronger hidden-state rules so mobile responsive CSS cannot override hidden auth/app sections.
- Added authenticated body-state guard.
- Added real bottom spacing to the login page so the card does not feel clipped on desktop or mobile.
- Kept V2.4 tracker layout and fullscreen map behaviour.

V2.10:
- Added richer Android-style mobile visual design.
- Improved mobile page background with coloured gradients and grid depth.
- Strengthened visible borders and card contrast on phone layouts.
- Polished bottom navigation with icons, active glow, hover/tap states and safe-area spacing.
- Added colour and depth to mobile tracker cards, recovery bar, map card, command cards and login screen.
- Kept the V2.5 authentication visibility fix and V2.4 tracker structure.

V2.10:
- Started from V2.6.
- Login lower-left area now follows the requested structure:
  Auralis/Protected demo card on the left, with One app UI / SMS ignition / Native agent later stacked vertically on its right.
- Laptop-height screens should fit without zooming out.
- Large desktop screens keep the relaxed original V2.6 layout.
- Tracker, mobile styling, bottom navigation and command features remain V2.6-based.