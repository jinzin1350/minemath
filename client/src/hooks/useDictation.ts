import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DictationWord, DictationUserProgress, DictationGameHistory } from "@/types/dictation";

export function useDictation() {
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch user progress
  const { data: progress, isLoading: progressLoading } = useQuery<DictationUserProgress>({
    queryKey: ["/api/dictation/progress"],
  });

  // Fetch game history
  const { data: gameHistory } = useQuery<DictationGameHistory[]>({
    queryKey: ["/api/dictation/game-history"],
  });

  // Fetch words for game with caching
  const fetchWords = useCallback(async (level: number, limit: number = 10, category?: string) => {
    try {
      const params = new URLSearchParams({
        level: level.toString(),
        limit: limit.toString(),
      });
      if (category) {
        params.append("category", category);
      }

      const response = await fetch(`/api/dictation/words?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch words: ${response.status} ${response.statusText}`);
      }

      const words = await response.json();

      if (!Array.isArray(words) || words.length === 0) {
        throw new Error(`No words available for level ${level}`);
      }

      return words as DictationWord[];
    } catch (error) {
      console.error("Error fetching words:", error);
      throw error;
    }
  }, []);

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (data: Partial<DictationUserProgress>) => {
      return await apiRequest("POST", "/api/dictation/progress", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dictation/progress"] });
    },
  });

  // Save game history mutation
  const saveGameHistoryMutation = useMutation({
    mutationFn: async (data: Omit<DictationGameHistory, "id" | "userId" | "playedAt">) => {
      console.log(`🚀 Sending game history:`, data);
      const result = await apiRequest("POST", "/api/dictation/game-history", data);
      console.log(`✅ Game history saved:`, result);
      return result;
    },
    onSuccess: () => {
      console.log(`🔄 Invalidating queries after game history save`);
      queryClient.invalidateQueries({ queryKey: ["/api/dictation/game-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dictation/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dictation/progress-report"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dictation/weekly-report"] });
    },
    onError: (error) => {
      console.error(`❌ Failed to save game history:`, error);
    },
  });

  // Text-to-Speech functionality with improved quality
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Wait for voices to load
    const speakWithVoice = () => {
      const voices = window.speechSynthesis.getVoices();

      // Find the best English voice (prefer native, then Google, then any US English)
      const preferredVoice = voices.find(voice => 
        voice.lang === 'en-US' && (
          voice.name.includes('Google') || 
          voice.name.includes('Microsoft') ||
          voice.name.includes('Alex') ||
          voice.name.includes('Samantha') ||
          voice.localService
        )
      ) || voices.find(voice => voice.lang === 'en-US') || voices[0];

      const utterance = new SpeechSynthesisUtterance(text);

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.lang = "en-US";
      utterance.rate = 0.7; // Slower for better clarity
      utterance.pitch = 1;
      utterance.volume = 1;

      setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    };

    // If voices aren't loaded yet, wait for them
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', speakWithVoice, { once: true });
    } else {
      speakWithVoice();
    }
  }, []);

  // Stop speech
  const stopSpeech = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  return {
    progress,
    progressLoading,
    gameHistory,
    fetchWords,
    updateProgress: updateProgressMutation.mutate,
    saveGameHistory: saveGameHistoryMutation.mutate,
    speak,
    stopSpeech,
    isPlaying,
    isSaving: updateProgressMutation.isPending || saveGameHistoryMutation.isPending,
  };
}