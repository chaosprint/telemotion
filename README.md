# Telemotion

Telematic control for music installation with motions.

# Usage

## Preparation
Download:
https://github.com/automata/osc-web

Run:
```
cd osc-web
npm i
node bridge.js
```

Then visit: telemotion-alpha.web.app

When the motion reaches the threshold, a random MIDI signal will be sent to all the MIDI devices connected.

At the same time, a Tone.js note will be played as a reminder for testing.

At each frame (60FPS by default), the QoM of each column of the guest will be calculated at the host machine and sent via OSC to port 3334.

# Test locally

You can tweek the threshold, col numbers, DF algorithms, etc.

`
cd telemotion
npm i
npm run dev
`

# License

The MIT License (MIT)

Copyright (c) 2021 Qichao Lan (chaosprint)