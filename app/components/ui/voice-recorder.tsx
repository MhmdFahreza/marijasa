"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, X, Send } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startRecording();
    
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    console.log('Cleanup called');
    
    if (animationFrameRef.current) {
      console.log('Cleanup: canceling animation frame');
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      console.log('Cleanup: stopping stream');
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    
    startTimeRef.current = null;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        setAudioBlob(blob);
        cleanup();
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer dengan requestAnimationFrame untuk akurasi lebih baik
      startTimeRef.current = Date.now();
      const updateTimer = () => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setRecordingTime(elapsed);
        }
        animationFrameRef.current = requestAnimationFrame(updateTimer);
      };
      
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    } catch (error) {
      console.error('Error:', error);
      alert('Tidak dapat mengakses mikrofon');
      onCancel();
    }
  };

  const stopRecording = () => {
    console.log('Stop recording called, isRecording:', isRecording);
    
    if (mediaRecorderRef.current && isRecording) {
      setIsRecording(false);
      console.log('Stopping media recorder...');
      mediaRecorderRef.current.stop();
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, recordingTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 z-50 min-w-[320px]">
      <div className="flex flex-col items-center gap-4">
        {/* Recording indicator */}
        <div className="relative">
          <div className={`h-20 w-20 rounded-full flex items-center justify-center ${
            isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
          }`}>
            <Mic className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-gray-800">
            {formatTime(recordingTime)}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {isRecording ? 'Merekam...' : 'Siap dikirim'}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 rounded-full"
          >
            <X className="h-4 w-4 mr-2" />
            Batal
          </Button>
          
          {isRecording ? (
            <Button
              onClick={() => {
                console.log('Stop button clicked');
                stopRecording();
              }}
              className="flex-1 rounded-full bg-red-500 hover:bg-red-600"
            >
              Stop
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              className="flex-1 rounded-full bg-green-500 hover:bg-green-600"
              disabled={!audioBlob}
            >
              <Send className="h-4 w-4 mr-2" />
              Kirim
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}