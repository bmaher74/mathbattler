import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "@/app/AppRoutes";
import { queryClient } from "@/app/queryClient";

const el = document.getElementById("root");
if (!el) {
    throw new Error("#root missing");
}

const base = import.meta.env.BASE_URL;
const basename = base === "/" ? undefined : base.replace(/\/$/, "");

createRoot(el).render(
    <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={basename}>
            <App />
        </BrowserRouter>
    </QueryClientProvider>
);
