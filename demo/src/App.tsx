import React, { useState, useEffect } from 'react';
import { Glasatar, TextureType } from '../../src';
import Icon from './Icon';

function App() {
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [texture, setTexture] = useState<TextureType>('reeded');
  const [glassOpacity] = useState(0.95);
  const [refractionStrength, setRefractionStrength] = useState(20.0);
  const [blurAmount, setBlurAmount] = useState(15.0);
  const [avatarColor, setAvatarColor] = useState('#00c7fc');
  const [avatarSize, setAvatarSize] = useState(37);
  const [avatarSensitivity, setAvatarSensitivity] = useState(1.8);
  const [avatarExpansion, setAvatarExpansion] = useState(49.4);
  const [avatarSmoothing, setAvatarSmoothing] = useState(0.23);
  const [avatarFadeWithAudio, setAvatarFadeWithAudio] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#1a1a2e');
  const [backgroundType, setBackgroundType] = useState<
    'color' | 'radial-gradient' | 'linear-gradient' | 'image'
  >('linear-gradient');
  const [gradientCenter, setGradientCenter] = useState('#c4bc00');
  const [gradientEdge, setGradientEdge] = useState('#ff8647');
  const [gradientAngle, setGradientAngle] = useState(343);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(
    'https://picsum.photos/500/500?random=1'
  );
  const [backgroundRotation, setBackgroundRotation] = useState(true);
  const [backgroundRotationSpeed, setBackgroundRotationSpeed] = useState(10);
  const [backgroundScale, setBackgroundScale] = useState(1.5);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert(
        'Unable to access microphone. Please ensure you have granted permission.'
      );
    }
  };

  const stopRecording = () => {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioStream]);

  return (
    <div className="app-container">
      <header className="app-header">
        <Icon />
        <h1 className="app-title">Glasatar</h1>
        <p className="app-subtitle">
          A voice-reactive avatar seen through realistic obscure glass
        </p>
      </header>

      <div className="visualizer-container">
        <Glasatar
          audioStream={audioStream}
          width={500}
          height={500}
          texture={texture}
          glassOpacity={glassOpacity}
          refractionStrength={refractionStrength}
          blurAmount={blurAmount}
          avatarColor={avatarColor}
          avatarSize={avatarSize}
          avatarSensitivity={avatarSensitivity}
          avatarExpansion={avatarExpansion}
          avatarSmoothing={avatarSmoothing}
          avatarFadeWithAudio={avatarFadeWithAudio}
          backgroundColor={backgroundColor}
          backgroundType={backgroundType}
          backgroundGradient={{
            centerColor: gradientCenter,
            edgeColor: gradientEdge,
            angle: gradientAngle,
          }}
          backgroundImage={
            backgroundType === 'image' ? backgroundImageUrl : undefined
          }
          backgroundRotation={backgroundRotation}
          backgroundRotationSpeed={backgroundRotationSpeed}
          backgroundScale={backgroundScale}
          className="visualizer-canvas"
        />

        <div className="recording-status">
          {isRecording ? '🎤 Recording' : '🔇 Not Recording'}
        </div>
      </div>

      <div className="button-container">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`recording-button ${
            isRecording
              ? 'recording-button--active'
              : 'recording-button--inactive'
          }`}
        >
          <span
            className={`recording-indicator ${
              isRecording
                ? 'recording-indicator--active'
                : 'recording-indicator--inactive'
            }`}
          />
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>

      <div className="controls-grid">
        {/* SECTION 1: Glass & Visual Effects */}
        <div className="control-section">
          <h3 className="control-section__title">Glass & Visual Effects</h3>

          <div className="control-section__content">
            {/* Glass Texture */}
            <div>
              <label className="control-label">Glass Texture</label>
              <select
                value={texture}
                onChange={e => setTexture(e.target.value as TextureType)}
                className="select-input"
              >
                <option value="arctic">Arctic (Fine Crystal)</option>
                <option value="cathedral">Cathedral (Flowing)</option>
                <option value="autumn">Autumn (Organic)</option>
                <option value="flemish">Flemish (Hammered)</option>
                <option value="ripple">Ripple (Water Waves)</option>
                <option value="reeded">Reeded (Vertical Ridges)</option>
                <option value="vintage">Vintage (Aged Waves)</option>
                <option value="forest">Forest (Tree Branches)</option>
              </select>
              <p className="control-description">
                Different glass patterns that create unique visual distortion
                effects
              </p>
            </div>

            {/* Glass Refraction */}
            <div>
              <label className="control-label">
                Glass Refraction: {refractionStrength.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="25"
                step="0.1"
                value={refractionStrength}
                onChange={e =>
                  setRefractionStrength(parseFloat(e.target.value))
                }
                className="range-input"
              />
              <p className="control-description">
                How much the glass distorts the view behind it
              </p>
            </div>

            {/* Blur Amount */}
            <div>
              <label className="control-label">
                Blur Amount: {blurAmount.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={blurAmount}
                onChange={e => setBlurAmount(parseFloat(e.target.value))}
                className="range-input"
              />
              <p className="control-description">
                Amount of blur applied to the background through the glass
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Avatar Settings */}
        <div className="control-section">
          <h3 className="control-section__title">Avatar Settings</h3>

          <div className="control-section__content">
            {/* Avatar Color */}
            <div>
              <label className="control-label">Avatar Color</label>
              <div className="flex-row">
                <input
                  type="color"
                  value={avatarColor}
                  onChange={e => setAvatarColor(e.target.value)}
                  className="color-input"
                />
                <input
                  type="text"
                  value={avatarColor}
                  onChange={e => setAvatarColor(e.target.value)}
                  className="text-input text-input--flex"
                />
              </div>
              <p className="control-description">
                Color of the voice-reactive avatar circle
              </p>
            </div>

            {/* Avatar Size */}
            <div>
              <label className="control-label">
                Avatar Size: {avatarSize}px
              </label>
              <input
                type="range"
                min="3"
                max="150"
                value={avatarSize}
                onChange={e => setAvatarSize(parseInt(e.target.value))}
                className="range-input"
              />
              <p className="control-description">
                Base size of the avatar circle when silent
              </p>
            </div>

            {/* Voice Sensitivity */}
            <div>
              <label className="control-label">
                Voice Sensitivity: {avatarSensitivity.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={avatarSensitivity}
                onChange={e => setAvatarSensitivity(parseFloat(e.target.value))}
                className="range-input"
              />
              <p className="control-description">
                How responsive the avatar is to voice input
              </p>
            </div>

            {/* Max Expansion */}
            <div>
              <label className="control-label">
                Max Expansion: {avatarExpansion.toFixed(1)}x
              </label>
              <input
                type="range"
                min="1"
                max="50"
                step="0.1"
                value={avatarExpansion}
                onChange={e => setAvatarExpansion(parseFloat(e.target.value))}
                className="range-input"
              />
              <p className="control-description">
                Maximum size multiplier when speaking loudly
              </p>
            </div>

            {/* Smoothing */}
            <div>
              <label className="control-label">
                Smoothing: {avatarSmoothing.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={avatarSmoothing}
                onChange={e => setAvatarSmoothing(parseFloat(e.target.value))}
                className="range-input"
              />
              <p className="control-description">
                Lower values = smoother transitions, higher = more responsive
              </p>
            </div>

            {/* Fade Avatar with Audio */}
            <div>
              <div className="flex-row">
                <input
                  type="checkbox"
                  id="avatarFadeWithAudio"
                  checked={avatarFadeWithAudio}
                  onChange={e => setAvatarFadeWithAudio(e.target.checked)}
                  className="checkbox-input"
                />
                <label
                  htmlFor="avatarFadeWithAudio"
                  className="control-label--checkbox"
                >
                  Fade Avatar with Audio
                </label>
              </div>
              <p className="control-description">
                Avatar becomes transparent when there&apos;s no sound or very
                low audio
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Background */}
        <div className="control-section">
          <h3 className="control-section__title">Background</h3>

          <div className="control-section__content">
            {/* Background Type */}
            <div>
              <label className="control-label">Background Type</label>
              <select
                value={backgroundType}
                onChange={e =>
                  setBackgroundType(
                    e.target.value as
                      | 'color'
                      | 'radial-gradient'
                      | 'linear-gradient'
                      | 'image'
                  )
                }
                className="select-input margin-bottom"
              >
                <option value="color">Solid Color</option>
                <option value="radial-gradient">Radial Gradient</option>
                <option value="linear-gradient">Linear Gradient</option>
                <option value="image">Image</option>
              </select>

              {backgroundType === 'color' && (
                <div className="flex-row">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={e => setBackgroundColor(e.target.value)}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={e => setBackgroundColor(e.target.value)}
                    className="text-input text-input--flex"
                  />
                </div>
              )}

              {(backgroundType === 'radial-gradient' ||
                backgroundType === 'linear-gradient') && (
                <div className="flex-column">
                  <div>
                    <label className="gradient-label">Center Color:</label>
                    <div className="flex-row margin-top">
                      <input
                        type="color"
                        value={gradientCenter}
                        onChange={e => setGradientCenter(e.target.value)}
                        className="color-input color-input--small"
                      />
                      <input
                        type="text"
                        value={gradientCenter}
                        onChange={e => setGradientCenter(e.target.value)}
                        className="text-input text-input--small text-input--flex"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="gradient-label">Edge Color:</label>
                    <div className="flex-row margin-top">
                      <input
                        type="color"
                        value={gradientEdge}
                        onChange={e => setGradientEdge(e.target.value)}
                        className="color-input color-input--small"
                      />
                      <input
                        type="text"
                        value={gradientEdge}
                        onChange={e => setGradientEdge(e.target.value)}
                        className="text-input text-input--small text-input--flex"
                      />
                    </div>
                  </div>

                  {backgroundType === 'linear-gradient' && (
                    <div>
                      <label className="gradient-label">
                        Angle: {gradientAngle}°
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={gradientAngle}
                        onChange={e =>
                          setGradientAngle(parseInt(e.target.value))
                        }
                        className="range-input range-input--margin-top"
                      />
                    </div>
                  )}
                </div>
              )}

              {backgroundType === 'image' && (
                <div>
                  <label className="gradient-label">Image URL:</label>
                  <input
                    type="text"
                    value={backgroundImageUrl}
                    onChange={e => setBackgroundImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="text-input text-input--full margin-top"
                  />
                  <div className="flex-wrap margin-top-large">
                    {['1', '2', '3', '4'].map(num => (
                      <button
                        key={num}
                        onClick={() =>
                          setBackgroundImageUrl(
                            `https://picsum.photos/500/500?random=${num}`
                          )
                        }
                        className="random-button"
                      >
                        Random {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rotate Background */}
            <div>
              <div className="flex-row">
                <input
                  type="checkbox"
                  id="backgroundRotation"
                  checked={backgroundRotation}
                  onChange={e => setBackgroundRotation(e.target.checked)}
                  className="checkbox-input"
                />
                <label
                  htmlFor="backgroundRotation"
                  className="control-label--checkbox"
                >
                  Rotate Background
                </label>
              </div>

              {backgroundRotation && (
                <div className="margin-top-large">
                  <label className="gradient-label">
                    Speed: {backgroundRotationSpeed}°/s
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={backgroundRotationSpeed}
                    onChange={e =>
                      setBackgroundRotationSpeed(parseFloat(e.target.value))
                    }
                    className="range-input range-input--margin-top"
                  />
                </div>
              )}
            </div>

            {/* Background Scale */}
            <div>
              <label className="control-label">
                Background Scale: {backgroundScale.toFixed(1)}x
              </label>
              <input
                type="range"
                min="1.0"
                max="2.0"
                step="0.1"
                value={backgroundScale}
                onChange={e => setBackgroundScale(parseFloat(e.target.value))}
                className="range-input"
              />
              <p className="control-description">
                Scales background larger to prevent empty corners during
                rotation
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="info-section">
        <h3 className="info-title">How it works:</h3>
        <ul className="info-list">
          <li>
            The <strong>glass texture</strong> is fixed and doesn&apos;t change
          </li>
          <li>
            Behind the glass is a colored <strong>avatar circle</strong> that
            responds to your voice
          </li>
          <li>
            When you speak, the avatar <strong>expands and contracts</strong>{' '}
            with the audio level
          </li>
          <li>
            <strong>Voice Sensitivity</strong> controls how responsive the
            avatar is to audio
          </li>
          <li>
            <strong>Max Expansion</strong> controls how big the avatar can grow
            (1x = no growth, 50x = massive growth)
          </li>
          <li>
            <strong>Smoothing</strong> controls transition speed (0.01 = very
            smooth, 0.5 = very responsive)
          </li>
          <li>
            The glass <strong>distorts and blurs</strong> the avatar, creating
            the privacy effect
          </li>
        </ul>
      </div>

      <footer className="app-footer">
        <p>Built with WebGL, Web Audio API, React, and TypeScript</p>
        <a
          href="https://github.com/jimhill/glasatarjs"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
          aria-label="View on GitHub"
        >
          <svg
            className="github-icon"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
      </footer>
    </div>
  );
}

export default App;
