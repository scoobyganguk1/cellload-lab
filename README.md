# CellLoad Lab

CellLoad Lab is an educational, browser based 5G capacity simulator presented as a phone shaped field instrument. Its compact screen uses a field-notes style, hand-set labels, warm paper colors, and a physical handset frame on desktop. It models synthetic users competing for a finite radio capacity budget, then lets you compare scheduling and admission policies. It does not connect to cellular equipment, transmit traffic, interact with eSIM providers, or affect real users or networks.

## Run it

Open `index.html` in a modern browser. No install, network access, or build step is required.

## What you can explore

- Change the number of synthetic cells and each cell's abstract capacity.
- Set user arrival rate, session duration, and demand.
- Model a small fraction of users with multiple subscriptions. In the model, those subscriptions add demand to the same shared cell; they do not represent real SIM or radio connections.
- Compare best-effort, fair-share, and admission-control scheduling.
- Watch total served demand, blocked sessions, active users, and per-cell load over simulated time.
- Pause, step, reset, and export a CSV snapshot of the current run.

## Model notes

This is a deliberately simplified queueing and allocation model, not a standards-accurate 3GPP implementation or a predictor of real-world network performance. Capacity is expressed in arbitrary units. Users are generated locally from a seeded pseudo-random sequence; no real-world identifiers or endpoints are used.

In **Best effort**, each session requests its configured demand and capacity is shared proportionally when overloaded. **Fair share** gives each active user an equal initial share, then redistributes unused capacity among users whose demand exceeds that share. **Admission control** admits a new session only when its requested demand fits the remaining capacity of its selected cell. The multiple-subscription setting increases a synthetic user's requested demand, making it possible to discuss why fair scheduling and admission policy matter.

## Project layout

- `index.html` - handset screen, controls, dashboard, and chart surface
- `styles.css` - phone frame and responsive styling
- `app.js` — simulation model, rendering, and CSV export

## Safety boundary

Use this project only as a local educational simulation. It intentionally contains no packet generator, radio control, modem/eSIM integration, nearby-device discovery, or instructions for disrupting a live network.

## License

MIT. See `LICENSE`.
