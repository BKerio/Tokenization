import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";

import Home from "@/pages/home";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <Router>
          <main className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </main>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
