# ZeaZDev Unity Game Package

This package contains the Unity WebGL game integration for ZeaZDev.

## Structure

```
Assets/
├── Scripts/
│   └── Web3Bridge.cs    # Unity/RN Bridge for Web3 interactions
├── Scenes/
│   └── SlotGame.unity   # Main slot game scene
└── Prefabs/
    └── SlotMachine.prefab
```

## Setup

1. Open project in Unity Hub (2021.3+)
2. Build for WebGL platform
3. Deploy to web server
4. Configure URL in frontend .env

## Integration

The Web3Bridge.cs script handles:
- Receiving bets from React Native
- Slot game logic (provably fair)
- Sending results back to RN
- $ZEA and $DING token support
