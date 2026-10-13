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

## How to validate the model

The browser simulator illustrates a policy; it is not proof that a real 5G network will behave the same way. Its admission policy turns away a **new synthetic session** when the modelled cell has no remaining capacity. It does not disconnect active users.

For a real comparison, use an isolated, authorised testbed with a private 5G core and gNB, test UEs, or a network simulator. Keep public networks and uninvolved users out of the test.

1. Write down the hypothesis, such as the load level at which the test network begins rejecting new sessions.
2. Run a baseline using the planned session mix at normal load.
3. Increase offered load in controlled steps, staying within limits agreed with the testbed owner.
4. Record attempted, accepted, and rejected sessions and rejection causes, alongside radio resource use, active UEs, throughput, latency, and packet loss.
5. Tune the simulator against one run, then check its predictions against a separate run. Report the differences and the conditions the model does not represent.

Interpret results at both layers: the gNB handles radio admission and scheduling, while PDU session establishment is a separate 5G procedure. See [3GPP TS 38.300](https://www.etsi.org/deliver/etsi_ts/138300_138399/138300/18.07.00_60/ts_138300v180700p.pdf) and [3GPP TS 23.502](https://www.etsi.org/deliver/etsi_ts/123500_123599/123502/18.05.00_60/ts_123502v180500p.pdf).

This validates a defensive model in that specific lab. It does not demonstrate or authorise disrupting a public network.

## Project layout

- `index.html` - handset screen, controls, dashboard, and chart surface
- `styles.css` - phone frame and responsive styling
- `app.js` — simulation model, rendering, and CSV export

## Safety boundary

Use this project only as a local educational simulation. It intentionally contains no packet generator, radio control, modem/eSIM integration, nearby-device discovery, or instructions for disrupting a live network.

## License

MIT. See `LICENSE`.
