# Mahila Shield AI

A travel safety app for women commuting in Madhya Pradesh. Pick a route, travel it, and if your ride starts going somewhere it shouldn't, the app notices before you have to.

Built for AI मंथन 2.0 at Acropolis Institute, Indore.

## The problem

Maps apps give you the fastest route. They don't tell you the fastest route cuts through an unlit stretch with no help nearby. And once you're in a cab or auto, nothing is watching if the driver takes a turn you didn't expect.

## What it does

**Compares routes by safety, not just time.** Each route gets a score from 45 to 99 based on three things: how close it runs to verified police stations and hospitals (40%), how busy the area is (35%), and the district's crime rate from NCRB data (25%). Stations and hospitals show up as pins on the map.

**Safety heatmap.** Switch between crime, footfall, or a combined view to see where the risky pockets are before you set off.

**Watches the journey.** If you're more than 80 m off your chosen route for three checks in a row, the app asks "Are you okay?" and starts a countdown (30 seconds by default).

**Escalates if you don't answer.** No reply means the siren starts and your guardians are alerted with your live coordinates.

**Hold-to-SOS.** Hold the button for 1.2 seconds. The hold is deliberate so it can't be triggered by accident in a bag or pocket. There is also a one-tap link to 112.

**Guardians and history.** Save trusted contacts, review past trips, export your history as JSON.

**Privacy first.** Location is only used during a journey, and the app asks for consent before it starts.

## Demo

The app has a built-in GPS simulator, so you can see the whole flow without leaving your chair. Open the telemetry panel on the map, hit **Step** to start moving along the route, then **+150m Detour** to push the vehicle off course. The check-in prompt, countdown and escalation play out from there.

Try the Indore route: Vijay Nagar Square to Rajwada. It offers three options, from the well-lit AB Road BRTS corridor (score 96) down to the inner alleys (score 42).

## Built with

React 19, TypeScript, Vite, Tailwind CSS, Google Maps Platform (maps, traffic, heatmap), Motion.

## What is real and what is a prototype

- Route safety scores use district crime baselines based on NCRB figures. The police station, hospital and footfall points are a hand-curated sample for Indore and Bhopal, not a complete dataset.
- Guardian alerts are simulated in this build. A production version needs an SMS or WhatsApp backend, which is the next thing we would add.
- Gwalior, Jabalpur and Ujjain have crime baselines in place and are waiting on route and infrastructure data.
  
## Live link 
https://mahila-shield-5q8c-cdhstgiy6-pj-0703.vercel.app/
## Author

Prashuk Jain
