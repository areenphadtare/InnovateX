import React, { useEffect, useId, useState } from 'react';
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

const duration = 24;

function getNarration(event) {
  const title = event.title.toLowerCase();
  if (title.includes('component') || title.includes('baseplate') || title.includes('implant')) return 'Synthetic demonstration: orthopaedic instruments align a simplified joint implant with the prepared area. This is a generated illustration, not patient footage or surgical guidance.';
  if (title.includes('range of motion')) return 'Synthetic demonstration: the joint is moved through a simplified range while the team records an observation. This is generated narration, not a real operating-room recording.';
  if (title.includes('bone cuts')) return 'Synthetic demonstration: a simplified orthopaedic surgical field and instruments are shown. The animation does not depict a real procedure.';
  if (title.includes('incision')) return 'Synthetic demonstration: an abstract orthopaedic camera view is shown for this timeline event. This is not patient footage.';
  if (title.includes('tourniquet')) return 'Synthetic demonstration: a tourniquet-related event is logged for team verification. This is generated narration, not a real audio recording.';
  if (title.includes('cefazolin')) return 'Synthetic demonstration: a medication event is announced and recorded for team verification. This is not a real audio recording.';
  return 'Synthetic demonstration: operating-room event captured for the timeline. This animation and narration are generated for the prototype, not from a real procedure.';
}

function formatTime(seconds) {
  return `00:${String(seconds).padStart(2, '0')}`;
}

function SyntheticEvidenceReplay({ event }) {
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const narration = getNarration(event);
  const showsImplant = /component|baseplate|implant/i.test(event.title);
  const sceneId = `synthetic-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setCurrentTime((time) => {
        if (time >= duration - 1) {
          setPlaying(false);
          return duration;
        }
        return time + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const toggleNarration = () => {
    if (audioPlaying) {
      window.speechSynthesis?.cancel();
      setAudioPlaying(false);
      return;
    }
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(narration);
    utterance.onend = () => setAudioPlaying(false);
    utterance.onerror = () => setAudioPlaying(false);
    setAudioPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const seek = (eventInput) => {
    setCurrentTime(Number(eventInput.target.value));
    setPlaying(false);
  };

  const restart = () => {
    setCurrentTime(0);
    setPlaying(true);
  };

  return (
    <div className="synthetic-replay">
      <div className={`simulation-screen ${playing ? 'is-playing' : ''}`}>
        <svg className="simulation-scene" viewBox="0 0 800 450" role="img" aria-label="Animated synthetic orthopaedic surgery simulation">
          <defs>
            <radialGradient id={`${sceneId}-scope`} cx="50%" cy="48%" r="53%">
              <stop offset="0" stopColor="#496b5e" />
              <stop offset=".58" stopColor="#294b42" />
              <stop offset="1" stopColor="#101c1b" />
            </radialGradient>
            <linearGradient id={`${sceneId}-tool`} x1="0" x2="1">
              <stop stopColor="#d5ddda" />
              <stop offset=".45" stopColor="#879d98" />
              <stop offset="1" stopColor="#d9e2df" />
            </linearGradient>
            <clipPath id={`${sceneId}-scope-clip`}><ellipse cx="400" cy="228" rx="315" ry="188" /></clipPath>
          </defs>
          <rect width="800" height="450" fill="#101819" />
          <g clipPath={`url(#${sceneId}-scope-clip)`}>
            <rect x="85" y="40" width="630" height="376" fill={`url(#${sceneId}-scope)`} />
            <path d="M338 64 C330 126 345 170 359 199 C365 213 365 232 351 248 C338 264 338 284 349 302 C365 329 364 362 350 395 L444 395 C430 359 435 330 451 301 C461 281 460 260 446 245 C431 228 432 211 441 194 C459 158 467 115 456 64Z" fill="#d5ddcf" opacity=".7" />
            <path d="M371 71 C365 125 375 166 389 193 C396 208 394 227 378 245 C366 259 367 276 379 289 C395 306 394 335 386 373" fill="none" stroke="#f1ead4" strokeWidth="10" opacity=".7" />
            <path d="M423 71 C429 125 419 166 405 193 C398 208 400 227 416 245 C428 259 427 276 415 289 C399 306 400 335 408 373" fill="none" stroke="#f1ead4" strokeWidth="10" opacity=".7" />
            <path d="M359 238 C374 222 386 220 400 229 C414 220 427 222 441 238 L430 271 C418 281 410 282 400 276 C390 282 382 281 370 271Z" fill="#91aa96" opacity=".92" />
            <path d="M369 281 C383 291 417 291 431 281 L439 302 C424 314 376 314 361 302Z" fill="#b8c2ad" opacity=".85" />
            {showsImplant && <g className="simulated-implant"><path d="M370 245 Q400 225 430 245 L425 256 Q400 245 375 256Z" fill="#d4b96e" stroke="#f2dfa0" strokeWidth="2" /><path d="M374 286 Q400 294 426 286 L431 299 Q400 309 369 299Z" fill="#d4b96e" stroke="#f2dfa0" strokeWidth="2" /></g>}
            <g className="tool-left">
              <path d="M160 75 L355 246" fill="none" stroke="#172322" strokeWidth="23" />
              <path d="M160 75 L355 246" fill="none" stroke={`url(#${sceneId}-tool)`} strokeWidth="13" />
              <path d="M355 246 L378 263 M355 246 L381 248" fill="none" stroke="#d7dfdc" strokeWidth="5" strokeLinecap="round" />
            </g>
            <g className="tool-right">
              <path d="M650 76 L446 242" fill="none" stroke="#172322" strokeWidth="23" />
              <path d="M650 76 L446 242" fill="none" stroke={`url(#${sceneId}-tool)`} strokeWidth="13" />
              <path d="M446 242 L424 257 M446 242 L421 241" fill="none" stroke="#d7dfdc" strokeWidth="5" strokeLinecap="round" />
            </g>
            {showsImplant && <text x="400" y="333" textAnchor="middle" fill="#f3dfa0" fontSize="9" fontFamily="sans-serif" letterSpacing="1">IMPLANT EVENT · SIMULATED</text>}
            <ellipse cx="400" cy="228" rx="315" ry="188" fill="none" stroke="#0a1111" strokeWidth="16" opacity=".84" />
          </g>
          <text x="24" y="34" fill="#e4efec" fontSize="13" fontFamily="sans-serif" letterSpacing="2">SYNTHETIC ORTHOPAEDIC VIEW</text>
          <text x="24" y="58" fill="#a5bfba" fontSize="11" fontFamily="sans-serif">DEMO ONLY • NOT CLINICAL FOOTAGE</text>
          <circle cx="765" cy="34" r="5" fill="#6bd2a0" />
          <text x="752" y="58" textAnchor="end" fill="#b9cfca" fontSize="10" fontFamily="sans-serif">SIMULATED FEED</text>
          <text x="24" y="426" fill="#d2e0db" fontSize="11" fontFamily="monospace">{event.time}  •  {event.title.toUpperCase()}</text>
          <text x="776" y="426" textAnchor="end" fill="#9eb4af" fontSize="10" fontFamily="monospace">FRAME {String(currentTime * 25).padStart(4, '0')}</text>
        </svg>
        <div className="synthetic-watermark">SYNTHETIC DEMO</div>
      </div>
      <div className="replay-caption"><span className="caption-dot" />{narration}</div>
      <div className="replay-controls">
        <button aria-label={playing ? 'Pause synthetic video' : 'Play synthetic video'} onClick={() => setPlaying((value) => !value)}>
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <span className="replay-time">{formatTime(currentTime)}</span>
        <input aria-label="Seek synthetic video" type="range" min="0" max={duration} value={currentTime} onChange={seek} />
        <span className="replay-time">{formatTime(duration)}</span>
        <button aria-label="Restart synthetic video" onClick={restart}><RotateCcw size={14} /></button>
        <button aria-label={audioPlaying ? 'Stop audio narration' : 'Play audio narration'} onClick={toggleNarration}>
          {audioPlaying ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
      </div>
      <p className="synthetic-disclaimer">Synthetic visual and computer-generated narration for interface demonstration only. No real patient footage or operating-room audio.</p>
    </div>
  );
}

export default SyntheticEvidenceReplay;
