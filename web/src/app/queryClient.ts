import { QueryClient } from "@tanstack/react-query";

/** Shared client for profile sync, callables, and other async server state (Phase 2+). */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false
        }
    }
});
