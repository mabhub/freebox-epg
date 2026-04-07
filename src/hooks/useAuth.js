import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkAuth, login, logout } from '@/api/auth';

export const useAuth = () =>
  useQuery({
    queryKey: ['auth'],
    queryFn: checkAuth,
    retry: false,
    staleTime: Infinity,
  });

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (password) => login(password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth'] }),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};
