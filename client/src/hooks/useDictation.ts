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

  // Fetch words for game
  const fetchWords = async (level: number, limit: number = 10, category?: string) => {
    const params = new URLSearchParams({
      level: level.toString(),
      limit: limit.toString(),
    });
    if (category) {
      params.append("category", category);
    }
    const response = await fetch(`/api/dictation/words?${params}`);
    if (!response.ok) throw new Error("Failed to fetch words");
    return response.json() as Promise<DictationWord[]>;
  };

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
      return await apiRequest("POST", "/api/dictation/game-history", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dictation/game-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dictation/progress"] });
    },
  });

  // Text-to-Speech functionality
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
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
