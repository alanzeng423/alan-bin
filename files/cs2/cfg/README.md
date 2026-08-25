# Alan's CS2 Config Files

## Contents

- `autoexec.cfg` - Main autoexec config (sensitivity, crosshair, viewmodel, binds, rates, performance)

## Installation

1. Copy `autoexec.cfg` to your CS2 cfg folder:
   ```
   Steam\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg\
   ```
2. Add `+exec autoexec.cfg` to CS2 launch options in Steam:
   - Right-click CS2 → Properties → General → Launch Options
3. Launch the game and verify with console command: `exec autoexec`

## Key Settings

- **Sensitivity:** 1.45 (raw input, no acceleration)
- **Crosshair:** Classic static, red (-2 gap, size 2, thickness 1)
- **Viewmodel:** FOV 68, offset 2.5/0/-1.5
- **Radar:** Optimized (not always centered, scale 0.35)
- **Rates:** 128-tick settings
- **Jump throw:** Bind to ALT key
- **Buy binds:** Numpad keys for quick buys

## Launch Options (recommended)

```
-novid -nojoy -d3d9ex -freq 240 -refresh 240 -high +exec autoexec.cfg
```

Adjust `-freq`/`-refresh` to match your monitor.
