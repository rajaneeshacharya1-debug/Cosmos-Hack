AURALIS BEACON FOUNDATION V2.21

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


V2.21 changes:
- Improved responsive layout for desktop, compact laptop, mobile portrait and mobile landscape.
- Login page redesigned with a mobile app preview.
- Track page simplified to demo-safe recovery controls: Resume, Ring, Normal/Power Save tracking, Stop.
- Removed visible duplicate commands like manual status/location because location, battery and status already refresh automatically.
- Added in-app note explaining that web/PWA is excellent for dashboard/tracker UI but cannot replace a native Android agent for background SMS/device-control work.
- Keeps port 8800 for the stable ngrok URL: https://barbecue-fog-boots.ngrok-free.dev


V2.21:
- Restored the original desktop tracker structure: selected device | map | recovery controls side by side.
- Kept Compact mode as a different layout, not identical to Desktop.
- Rebuilt Phone preview so it stays one-column and no longer collapses into a broken sliver.
- Added fullscreen map mode.
- Removed the duplicate tracker-layout bar and the planning-only "Why fewer commands?" box.
- Improved real mobile login and tracker layout across portrait and landscape.
- Fixed the collapsed protected badge styling.

V2.21:
- Fixed phone-browser bug where the login section stayed visible over dashboard pages after login.
- Added stronger hidden-state rules so mobile responsive CSS cannot override hidden auth/app sections.
- Added authenticated body-state guard.
- Added real bottom spacing to the login page so the card does not feel clipped on desktop or mobile.
- Kept V2.4 tracker layout and fullscreen map behaviour.

V2.21:
- Added richer Android-style mobile visual design.
- Improved mobile page background with coloured gradients and grid depth.
- Strengthened visible borders and card contrast on phone layouts.
- Polished bottom navigation with icons, active glow, hover/tap states and safe-area spacing.
- Added colour and depth to mobile tracker cards, recovery bar, map card, command cards and login screen.
- Kept the V2.5 authentication visibility fix and V2.4 tracker structure.

V2.21:
- Started again from V2.6.
- Rebuilt only the login-page sizing/layout.
- Main login panel now uses viewport-bounded height with real top and bottom margin.
- Demo card and feature boxes use the requested structure: Auralis/Protected card on the left, three feature boxes stacked to its right.
- Tracker, phone styling, bottom nav and recovery logic remain V2.6-based.

V2.21 COMMAND POLLER:
- Adds MacroDroid-friendly plain-text command poll endpoint:
  /api/device/oppo-f19/macro-poll?token=auralis-demo-token-4729
- Adds completion endpoint:
  /api/device/oppo-f19/macro-complete?token=auralis-demo-token-4729&status=COMPLETED&detail=MacroDroid_executed
- Adds status endpoint:
  /api/device/oppo-f19/macro-status?token=auralis-demo-token-4729
- Poll response examples:
  NONE
  CMD:RING;ID:7
  CMD:STOP_RECOVERY;ID:8
- Polling marks pending commands as RECEIVED.
- Completion marks the last RECEIVED command as COMPLETED unless an id is supplied.
- Protection and Settings pages now show command bridge details.

V2.21:
- Fixes stale live state after STOP.
- STOPPED state is now authoritative: recoveryActive is false when mode is STOPPED.
- Late LIVE_TRACKING/MOBILE_DATA packets are ignored after STOP unless force=true.
- Adds /reset-state endpoint for clean demo reset:
  /api/device/oppo-f19/reset-state?token=auralis-demo-token-4729
- Adds /force-stop endpoint:
  /api/device/oppo-f19/force-stop?token=auralis-demo-token-4729
- Dashboard now exposes freshness fields and reset button.
- Note: old folders have separate auralis-db.json files, so switching folders can show older saved states.

V2.21:
- Adds original alert audio file:
  /auralis-beacon-alert.wav
- Public fixed demo audio URL when ngrok is running:
  https://barbecue-fog-boots.ngrok-free.dev/auralis-beacon-alert.wav
- Adds Stop Ring button using existing SILENT command.
- Settings bridge instructions now include SILENT handling.
- MacroDroid poller should handle:
  RING -> play/speak alert, complete command.
  SILENT -> stop playback or set media/alarm/ring volume lower, complete command.

V2.21:
- Adds explicit STOP_RING command instead of using SILENT wording.
- Keeps SILENT as a backward-compatible alias on the server.
- Dashboard now has the paired command design:
  Ring Device -> RING
  Stop Ring -> STOP_RING
- MacroDroid poller should use:
  If response contains RING -> set Auralis_Ring_Enabled true and play alert.
  If response contains STOP_RING -> set Auralis_Ring_Enabled false and stop/lower media output.

V2.21:
- Adds the Stop Ring option to the actual Recovery Controls command stack.
- Ring Device sends command: RING.
- Stop Ring sends command: STOP_RING.
- Server allowedCommands now includes STOP_RING.
- Existing saved DB configs are patched to include STOP_RING automatically.
- SILENT remains accepted as backward-compatible alias and is normalized to STOP_RING.
- MacroDroid Command Poller should use:
  If Auralis_Command_Response contains CMD:RING; -> set Auralis_Ring_Enabled true.
  If Auralis_Command_Response contains CMD:STOP_RING; -> set Auralis_Ring_Enabled false.

V2.21:
- Built from V2.16 to preserve the working tracking/server behaviour.
- Renames Judge Demo to Demo.
- Replaces the basic demo page with an animated signal-flow demo.
- Removes the pitch script from the app.
- MacroDroid Setup now clearly shows all five macros in a top strip and detailed cards.
- Keeps V2.16 Stop Ring / STOP_RING support.

V2.21:
- Adds cinematic desktop preloader with animated beacon core, orbiting packets, scanning grid and loading sequence.
- Adds separate mobile preloader with phone-style beacon animation.
- Adds global glow polish across cards, nav items, buttons, map panels and live status elements.
- Adds animated border highlights and subtle shine effects while preserving V2.18/V2.16 tracking behaviour.

V2.21:
- Adds cinematic animated login background inspired by the V2.19 preloader.
- Adds global ambient particle field.
- Adds living authenticated-app background with aurora/grid motion.
- Makes tracking page more alive with pulsing map beacon, banner sweep, glowing command controls and animated status pills.
- Adds page reveal, card lift, scan lines, flow-node glow and lifecycle packet animation.
- Preserves V2.19/V2.18 tracking and MacroDroid bridge behaviour.

V2.21:
- Enhances Home/Auralis Beacon card with orbital logo and product signal stack.
- Adds more hover/glow behaviour to tracking cards and command controls.
- Adds icon-style markers for tracking status/stat cards.
- Improves Demo architecture section with stronger visual hierarchy and margins.
- Improves MacroDroid setup page with hover/selection effects and a 5-macro badge.
- Adds Auto Demo button that automatically tours Home, Demo, Track, Activity, Macro Setup and Settings.
- Adds login quick-fill button for demo credentials.