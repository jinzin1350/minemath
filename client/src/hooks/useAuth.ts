import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // If there's an auth error, try to redirect to login
  if (error && error.message.includes('401')) {
    console.log('Auth error detected, user needs to login');
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}