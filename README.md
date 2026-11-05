# Simple Normalize Disabler

A Chrome extension that turns off YouTube's loudness normalization.

YouTube lowers the volume of loud videos to match a loudness target. This extension keeps the video at the volume you set. Stats for nerds shows the volume that is actually playing and the video's real loudness:

```
Volume  100% (cont.-8.3dB)
```

Works on youtube.com, m.youtube.com, music.youtube.com and embedded players. It does not touch Stable Volume (DRC).

## Install

- Chrome Web Store: coming soon
- Manual: open `chrome://extensions`, turn on Developer mode, click "Load unpacked" and pick this folder.

## How it works

The player sets `<video>.volume` to your volume multiplied by a normalization factor. The extension intercepts that assignment and uses your volume (`player.getVolume()`) instead. The loudness data from YouTube is left as is.

No data is collected. No permissions besides running on YouTube pages.

## License

MIT © nemut.ai
