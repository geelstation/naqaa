export interface YouTubePlayerApi {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  loadVideoById: (videoId: string) => void;
  destroy: () => void;
}

let player: YouTubePlayerApi | null = null;

export function setYouTubePlayer(nextPlayer: YouTubePlayerApi | null): void {
  player = nextPlayer;
}

export const youtubeControls = {
  play: () => player?.playVideo(),
  pause: () => player?.pauseVideo(),
  stop: () => player?.stopVideo(),
  seek: (seconds: number) => player?.seekTo(seconds, true),
  setVolume: (volume: number) => player?.setVolume(Math.round(volume * 100)),
  mute: () => player?.mute(),
  unMute: () => player?.unMute(),
};
