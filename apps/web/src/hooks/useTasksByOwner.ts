import { useQuery } from '@tanstack/react-query';
import { getTasksByOwner } from '@/api/user-tasks.api';

/**
 * Hook to retrieve tasks by owner address
 */
export function useTasksByOwner(userAddress?: string) {
  return useQuery({
    queryKey: ['userTasks', userAddress],
    queryFn: () => getTasksByOwner(userAddress || ''),
    enabled: !!userAddress,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
} 