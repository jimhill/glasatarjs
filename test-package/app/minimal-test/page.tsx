'use client';

import { useState } from 'react';
import { Glasatar } from '@jimhill/glasatarjs';

export default function MinimalTestPage() {
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone');
    }
  };

  const stopRecording = () => {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Minimal Glasatar Test</h1>
      <p className="mb-4">Testing with minimal props (just audioStream)</p>

      <div className="mb-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded"
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>

      <div className="border border-gray-700 inline-block">
        <Glasatar audioStream={audioStream} />
      </div>

      <div className="mt-4 text-sm text-gray-400">
        Status: {isRecording ? '🎤 Recording' : '🔇 Not Recording'}
        <br />
        This should use all default values.
      </div>
    </div>
  );
}
