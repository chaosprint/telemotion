# Telemotion

Telematic control for music installation with motions.

# Usage

## Preparation

You should have `git` and `node.js` installed.

Run:
```
git clone https://github.com/automata/osc-web
cd osc-web
npm i
node bridge.js
```

Then visit: https://telemotion-alpha.web.app

You are ready to go.

When the overall motion quantity reaches the threshold, a random MIDI signal will be sent to all the MIDI devices connected.

At the same time, a Tone.js note will be played as a reminder for testing.

At each frame (60FPS by default), the QoM of each column (default 4) of the guest will be calculated at the host machine and sent via OSC to port 3334.

You can receive these OSC messages for further mappings, etc.

# Test locally

You can tweek the threshold, column numbers, DF algorithms, etc.

```
git clone https://github.com/chaosprint/telemotion.git
cd telemotion
npm i
npm run dev
```

# License

The MIT License (MIT)

Copyright (c) 2021 Qichao Lan (chaosprint)