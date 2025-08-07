import React, { useState, useEffect } from 'react';
import { Glasatar, TextureType, AvatarState, AvatarShape } from '../../src';
import Icon from './Icon';
import { CodeBlock } from './CodeBlock';

function App() {
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [texture, setTexture] = useState<TextureType>('reeded');
  const [glassOpacity] = useState(0.95);
  const [refractionStrength, setRefractionStrength] = useState(20.0);
  const [blurAmount, setBlurAmount] = useState(15.0);
  const [avatarColor, setAvatarColor] = useState('#00c7fc');
  const [avatarSize, setAvatarSize] = useState(19);
  const [avatarSensitivity, setAvatarSensitivity] = useState(1.2);
  const [avatarExpansion, setAvatarExpansion] = useState(27);
  const [avatarSmoothing, setAvatarSmoothing] = useState(0.34);
  const [avatarFadeWithAudio, setAvatarFadeWithAudio] = useState(true);
  const [avatarState, setAvatarState] = useState<AvatarState>('speaking');
  const [avatarShape, setAvatarShape] = useState<AvatarShape>('square');
  const [listeningPulseBase, setListeningPulseBase] = useState(50);
  const [listeningPulseAmplitude, setListeningPulseAmplitude] = useState(35);
  const [listeningPulseSpeed, setListeningPulseSpeed] = useState(0.002);
  const [thinkingBorderWidth, setThinkingBorderWidth] = useState(6);
  const [thinkingBorderSpeed, setThinkingBorderSpeed] = useState(0.8);
  const [thinkingBorderLength, setThinkingBorderLength] = useState(0.15);
  const [thinkingBorderTrailSegments, setThinkingBorderTrailSegments] =
    useState(10);
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
      <a
        href="https://github.com/jimhill/glasatarjs"
        target="_blank"
        rel="noopener noreferrer"
        className="github-link github-link-top"
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
      <header className="app-header">
        <Icon />
        <h1 className="app-title">
          Glasatar <span className="app-title__js">js</span>
        </h1>
        <p className="app-subtitle">
          A voice-reactive avatar seen through realistic obscure glass
        </p>
      </header>

      <div
        className={`visualizer-container ${avatarShape === 'circle' ? 'visualizer-container--circle' : ''}`}
      >
        <Glasatar
          audioStream={audioStream}
          width={300}
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
          avatarState={avatarState}
          avatarShape={avatarShape}
          listeningPulseBase={listeningPulseBase}
          listeningPulseAmplitude={listeningPulseAmplitude}
          listeningPulseSpeed={listeningPulseSpeed}
          thinkingBorderWidth={thinkingBorderWidth}
          thinkingBorderSpeed={thinkingBorderSpeed}
          thinkingBorderLength={thinkingBorderLength}
          thinkingBorderTrailSegments={thinkingBorderTrailSegments}
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
          className={`visualizer-canvas ${avatarShape === 'circle' ? 'visualizer-canvas--circle' : ''}`}
        />
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
          {isRecording ? 'Stop Microphone' : 'Use Mic For AudioStream'}
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
                max="50"
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
            {/* Avatar Shape */}
            <div>
              <label className="control-label">Avatar Shape</label>
              <select
                value={avatarShape}
                onChange={e => setAvatarShape(e.target.value as AvatarShape)}
                className="select-input"
              >
                <option value="square">Square</option>
                <option value="circle">Circle</option>
              </select>
              <p className="control-description">
                Circle shapes work well for traditional avatars, square shapes
                for modern UI elements
              </p>
            </div>

            {/* Avatar State */}
            <div>
              <label htmlFor="avatarState" className="control-label">
                Avatar State
              </label>
              <select
                id="avatarState"
                value={avatarState}
                onChange={e => setAvatarState(e.target.value as AvatarState)}
                className="select-input"
              >
                <option value="speaking">Speaking</option>
                <option value="listening">Listening</option>
                <option value="thinking">Thinking</option>
              </select>
              <p className="control-description">
                Controls the avatar&apos;s visual state. Speaking mode responds
                to audio input, listening shows a pulsing inner glow, and
                thinking displays a rotating border animation.
              </p>
            </div>

            {/* Listening State Pulse Settings - Only show when listening state is selected */}
            {avatarState === 'listening' && (
              <>
                <div>
                  <label className="control-label">
                    Listening Pulse Size: {listeningPulseBase}px
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={listeningPulseBase}
                    onChange={e =>
                      setListeningPulseBase(parseInt(e.target.value))
                    }
                    className="range-input"
                  />
                  <p className="control-description">
                    Base width of the inner glow effect
                  </p>
                </div>

                <div>
                  <label className="control-label">
                    Listening Pulse Range: ±{listeningPulseAmplitude}px
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={listeningPulseAmplitude}
                    onChange={e =>
                      setListeningPulseAmplitude(parseInt(e.target.value))
                    }
                    className="range-input"
                  />
                  <p className="control-description">
                    How much the glow expands and contracts
                  </p>
                </div>

                <div>
                  <label className="control-label">
                    Listening Pulse Speed:{' '}
                    {(listeningPulseSpeed * 1000).toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.0005"
                    max="0.005"
                    step="0.0001"
                    value={listeningPulseSpeed}
                    onChange={e =>
                      setListeningPulseSpeed(parseFloat(e.target.value))
                    }
                    className="range-input"
                  />
                  <p className="control-description">
                    Speed of the pulsing animation
                  </p>
                </div>
              </>
            )}

            {/* Thinking State Border Settings - Only show when thinking state is selected */}
            {avatarState === 'thinking' && (
              <>
                <div>
                  <label className="control-label">
                    Border Width: {thinkingBorderWidth}px
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="15"
                    value={thinkingBorderWidth}
                    onChange={e =>
                      setThinkingBorderWidth(parseInt(e.target.value))
                    }
                    className="range-input"
                  />
                  <p className="control-description">
                    Width of the rotating border
                  </p>
                </div>

                <div>
                  <label className="control-label">
                    Border Speed: {thinkingBorderSpeed.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.2"
                    max="2.0"
                    step="0.1"
                    value={thinkingBorderSpeed}
                    onChange={e =>
                      setThinkingBorderSpeed(parseFloat(e.target.value))
                    }
                    className="range-input"
                  />
                  <p className="control-description">
                    Speed of border rotation (pixels per frame)
                  </p>
                </div>

                <div>
                  <label className="control-label">
                    Border Length: {(thinkingBorderLength * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.5"
                    step="0.01"
                    value={thinkingBorderLength}
                    onChange={e =>
                      setThinkingBorderLength(parseFloat(e.target.value))
                    }
                    className="range-input"
                  />
                  <p className="control-description">
                    Length of the rotating segment
                  </p>
                </div>

                <div>
                  <label className="control-label">
                    Trail Segments: {thinkingBorderTrailSegments}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={thinkingBorderTrailSegments}
                    onChange={e =>
                      setThinkingBorderTrailSegments(parseInt(e.target.value))
                    }
                    className="range-input"
                  />
                  <p className="control-description">
                    Number of trailing segments for the fade effect
                  </p>
                </div>
              </>
            )}

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

      <div className="info-section info-section--margin-top-large">
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

      <div className="info-section">
        <h3 className="info-title">How to use in React:</h3>
        <h2 className="info-step-title">Step 1: Install the package</h2>
        <CodeBlock language="bash" code={`npm install @jimhill/glasatarjs`} />
        <h2 className="info-step-title">Step 2: Import the component</h2>
        <CodeBlock
          language="tsx"
          code={`import React, { useState } from 'react';
import { Glasatar } from '@jimhill/glasatarjs';

function MyApp() {
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setAudioStream(stream);
  };

  return (
    <div>
      <button onClick={startRecording}>Use Mic For AudioStream</button>
      
      <Glasatar
        audioStream={audioStream}
        width={300}
        texture="reeded"
        avatarColor="#00c7fc"
        avatarSize={19} // Size in pixels
        avatarSensitivity={1.2} // Voice sensitivity multiplier
        avatarExpansion={27} // Maximum expansion in pixels
        avatarSmoothing={0.34} // Animation smoothing factor
        avatarState="speaking" // 'speaking', 'listening', or 'thinking'
        avatarShape="circle" // 'square' or 'circle'
        listeningPulseBase={50} // Base width of listening glow
        listeningPulseAmplitude={35} // Pulse range  
        listeningPulseSpeed={0.002} // Animation speed
        thinkingBorderWidth={6} // Border width for thinking
        thinkingBorderSpeed={0.8} // Rotation speed
        thinkingBorderLength={0.15} // Segment length (0-1)
        thinkingBorderTrailSegments={10} // Trail segments
        backgroundType="linear-gradient"
        backgroundGradient={{
          centerColor: "#c4bc00",
          edgeColor: "#ff8647",
          angle: 343
        }}
      />
    </div>
  );
}`}
        />
      </div>

      <div className="info-section">
        <h3 className="info-title">Props Reference:</h3>
        <div className="props-table-container">
          <table className="props-table">
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="section-header">
                  Essential
                </td>
              </tr>
              <tr>
                <td>
                  <code>audioStream</code>
                </td>
                <td>
                  <code>MediaStream | null</code>
                </td>
                <td>
                  <code>null</code>
                </td>
                <td>Audio stream from getUserMedia for voice reactivity</td>
              </tr>

              <tr>
                <td colSpan={4} className="section-header">
                  Canvas Dimensions
                </td>
              </tr>
              <tr>
                <td>
                  <code>width</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>800</code>
                </td>
                <td>
                  Canvas width/size in pixels (acts as size when avatarShape is
                  set)
                </td>
              </tr>
              <tr>
                <td>
                  <code>height</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>600</code>
                </td>
                <td>
                  Canvas height (ignored when avatarShape is circle or square)
                </td>
              </tr>

              <tr>
                <td colSpan={4} className="section-header">
                  Glass Effect
                </td>
              </tr>
              <tr>
                <td>
                  <code>texture</code>
                </td>
                <td>
                  <code>TextureType</code>
                </td>
                <td>
                  <code>&apos;arctic&apos;</code>
                </td>
                <td>
                  &apos;arctic&apos; | &apos;cathedral&apos; |
                  &apos;autumn&apos; | &apos;flemish&apos; | &apos;ripple&apos;
                  | &apos;reeded&apos; | &apos;vintage&apos; |
                  &apos;forest&apos;
                </td>
              </tr>
              <tr>
                <td>
                  <code>glassOpacity</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>0.95</code>
                </td>
                <td>Glass transparency (0-1)</td>
              </tr>
              <tr>
                <td>
                  <code>refractionStrength</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>1.0</code>
                </td>
                <td>How much the glass distorts the view</td>
              </tr>
              <tr>
                <td>
                  <code>blurAmount</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>3.0</code>
                </td>
                <td>Blur amount applied through glass</td>
              </tr>
              <tr>
                <td>
                  <code>fps</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>60</code>
                </td>
                <td>Target frame rate</td>
              </tr>

              <tr>
                <td colSpan={4} className="section-header">
                  Avatar
                </td>
              </tr>
              <tr>
                <td>
                  <code>avatarState</code>
                </td>
                <td>
                  <code>
                    &apos;speaking&apos; | &apos;listening&apos; |
                    &apos;thinking&apos;
                  </code>
                </td>
                <td>
                  <code>&apos;speaking&apos;</code>
                </td>
                <td>
                  Avatar visual state - speaking responds to audio, listening
                  shows pulsing inner glow, thinking shows rotating border
                </td>
              </tr>
              <tr>
                <td>
                  <code>avatarShape</code>
                </td>
                <td>
                  <code>&apos;square&apos; | &apos;circle&apos;</code>
                </td>
                <td>
                  <code>&apos;square&apos;</code>
                </td>
                <td>
                  Avatar shape - circle for traditional avatars, square for
                  modern UI elements
                </td>
              </tr>
              <tr>
                <td>
                  <code>listeningPulseBase</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>50</code>
                </td>
                <td>
                  Base width of the inner glow effect in listening state
                  (pixels)
                </td>
              </tr>
              <tr>
                <td>
                  <code>listeningPulseAmplitude</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>35</code>
                </td>
                <td>How much the glow expands and contracts (pixels)</td>
              </tr>
              <tr>
                <td>
                  <code>listeningPulseSpeed</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>0.002</code>
                </td>
                <td>Speed of the pulsing animation (lower = slower)</td>
              </tr>
              <tr>
                <td>
                  <code>thinkingBorderWidth</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>6</code>
                </td>
                <td>Width of the rotating border in thinking state (pixels)</td>
              </tr>
              <tr>
                <td>
                  <code>thinkingBorderSpeed</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>0.8</code>
                </td>
                <td>Speed of border rotation (pixels per frame)</td>
              </tr>
              <tr>
                <td>
                  <code>thinkingBorderLength</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>0.15</code>
                </td>
                <td>Length of the rotating segment (0-1 proportion)</td>
              </tr>
              <tr>
                <td>
                  <code>thinkingBorderTrailSegments</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>10</code>
                </td>
                <td>Number of trailing segments for fade effect</td>
              </tr>
              <tr>
                <td>
                  <code>avatarColor</code>
                </td>
                <td>
                  <code>string</code>
                </td>
                <td>
                  <code>&apos;#4A90E2&apos;</code>
                </td>
                <td>Color of the voice-reactive avatar</td>
              </tr>
              <tr>
                <td>
                  <code>avatarSize</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>80</code>
                </td>
                <td>Base size of avatar when silent</td>
              </tr>
              <tr>
                <td>
                  <code>avatarSensitivity</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>1.0</code>
                </td>
                <td>How responsive avatar is to voice</td>
              </tr>
              <tr>
                <td>
                  <code>avatarExpansion</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>2.0</code>
                </td>
                <td>Maximum size multiplier when speaking</td>
              </tr>
              <tr>
                <td>
                  <code>avatarSmoothing</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>0.25</code>
                </td>
                <td>Transition smoothness (lower = smoother)</td>
              </tr>
              <tr>
                <td>
                  <code>avatarFadeWithAudio</code>
                </td>
                <td>
                  <code>boolean</code>
                </td>
                <td>
                  <code>false</code>
                </td>
                <td>Avatar becomes transparent when silent</td>
              </tr>
              <tr>
                <td colSpan={4} className="section-header">
                  Background
                </td>
              </tr>
              <tr>
                <td>
                  <code>backgroundColor</code>
                </td>
                <td>
                  <code>string</code>
                </td>
                <td>
                  <code>&apos;#000000&apos;</code>
                </td>
                <td>Solid background color (hex)</td>
              </tr>
              <tr>
                <td>
                  <code>backgroundType</code>
                </td>
                <td>
                  <code>string</code>
                </td>
                <td>
                  <code>&apos;color&apos;</code>
                </td>
                <td>
                  &apos;color&apos; | &apos;radial-gradient&apos; |
                  &apos;linear-gradient&apos; | &apos;image&apos;
                </td>
              </tr>
              <tr>
                <td>
                  <code>backgroundGradient</code>
                </td>
                <td>
                  <code>object</code>
                </td>
                <td>
                  <code>{'{centerColor, edgeColor, angle}'}</code>
                </td>
                <td>Gradient colors and angle for gradient backgrounds</td>
              </tr>
              <tr>
                <td>
                  <code>backgroundImage</code>
                </td>
                <td>
                  <code>string</code>
                </td>
                <td>
                  <code>undefined</code>
                </td>
                <td>Image URL for image backgrounds</td>
              </tr>
              <tr>
                <td>
                  <code>backgroundRotation</code>
                </td>
                <td>
                  <code>boolean</code>
                </td>
                <td>
                  <code>true</code>
                </td>
                <td>Whether background rotates</td>
              </tr>
              <tr>
                <td>
                  <code>backgroundRotationSpeed</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>0</code>
                </td>
                <td>Rotation speed in degrees/second</td>
              </tr>
              <tr>
                <td>
                  <code>backgroundScale</code>
                </td>
                <td>
                  <code>number</code>
                </td>
                <td>
                  <code>1.0</code>
                </td>
                <td>Background scale multiplier</td>
              </tr>

              <tr>
                <td colSpan={4} className="section-header">
                  React
                </td>
              </tr>
              <tr>
                <td>
                  <code>className</code>
                </td>
                <td>
                  <code>string</code>
                </td>
                <td>
                  <code>undefined</code>
                </td>
                <td>CSS class name for the canvas</td>
              </tr>
              <tr>
                <td>
                  <code>style</code>
                </td>
                <td>
                  <code>CSSProperties</code>
                </td>
                <td>
                  <code>undefined</code>
                </td>
                <td>Inline styles for the canvas</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <footer className="app-footer">
        <div className="app-footer__me">
          <p>
            Built by Jim Hill. Contact me on{' '}
            <a
              href="https://x.com/jimhilluk"
              target="_blank"
              rel="noopener noreferrer"
            >
              X
            </a>{' '}
            or{' '}
            <a
              href="https://bsky.app/profile/jimhill.uk"
              target="_blank"
              rel="noopener noreferrer"
            >
              BlueSky
            </a>
          </p>
        </div>
        <p className="app-footer__text">
          Built with WebGL, Web Audio API, React, and TypeScript + thanks to{' '}
          <a href="https://claude.ai" target="_blank" rel="noopener noreferrer">
            Claude Code
          </a>
        </p>
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
