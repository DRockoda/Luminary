import { Mic, Pencil } from "lucide-react";

const WAVEFORM_HEIGHTS = [
  18, 32, 52, 38, 64, 24, 48, 70, 44, 28, 56, 36, 60, 30, 46, 68, 42, 22, 54,
  34, 50, 26, 40, 62,
];

export function AuthVisual() {
  return (
    <div className="auth-visual">
      <div className="auth-visual-bg">
        <div className="visual-blob visual-blob-1" aria-hidden />
        <div className="visual-blob visual-blob-2" aria-hidden />
        <div className="visual-grid" aria-hidden />

        {/* Audio entry — sits behind, tilted right */}
        <div className="visual-entry-card visual-entry-card-2">
          <div className="visual-entry-date">
            <span>Wed · April 16</span>
            <span className="visual-entry-mood visual-entry-mood--ok">~ Okay</span>
          </div>
          <div className="visual-entry-audio">
            <div className="visual-audio-icon">
              <Mic size={14} strokeWidth={2.2} />
            </div>
            <div className="visual-waveform">
              {WAVEFORM_HEIGHTS.map((h, i) => (
                <div
                  key={i}
                  className="visual-wave-bar"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <span className="visual-audio-time">2:14</span>
          </div>
          <div className="visual-entry-footer">
            <span className="visual-entry-type visual-entry-type--audio">
              <Mic size={10} strokeWidth={2.4} /> Voice memo
            </span>
            <span>10:42 PM</span>
          </div>
        </div>

        {/* Primary text entry — front, tilted left */}
        <div className="visual-entry-card">
          <div className="visual-entry-date">
            <span>Thursday · April 17</span>
            <span className="visual-entry-mood visual-entry-mood--great">
              <span className="visual-mood-dot" /> Great
            </span>
          </div>
          <div className="visual-entry-body">
            <p>
              Morning run along the river — caught the sunrise just as it spilled
              over the bridge. Feeling genuinely present today, like I&apos;m
              finally where I&apos;m supposed to be.
            </p>
          </div>
          <div className="visual-entry-footer">
            <span className="visual-entry-type">
              <Pencil size={10} strokeWidth={2.4} /> Text
            </span>
            <span>7:12 AM</span>
          </div>
        </div>

        <p className="auth-visual-tagline">Your private space to reflect.</p>
        <p className="auth-visual-subtagline">
          End-to-end encrypted · No ads · No tracking
        </p>
      </div>
    </div>
  );
}
