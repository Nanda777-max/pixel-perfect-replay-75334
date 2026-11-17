// Static entry for the GitHub Pages copy of the site (built by vite.pages.config.ts).
// It renders the same home page as the main app, without TanStack Start's server.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router';
import { Route as HomeRoute } from '@/routes/index';
import '@/styles.css';

const queryClient = new QueryClient();
const rootRoute = createRootRoute({
  component: () => <QueryClientProvider client={queryClient}><Outlet /></QueryClientProvider>,
});
const Home = HomeRoute.options.component;
if (!Home) throw new Error('The home route has no component.');
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Home });
const router = createRouter({ routeTree: rootRoute.addChildren([homeRoute]), basepath: import.meta.env.BASE_URL });

createRoot(document.getElementById('root')!).render(<StrictMode><RouterProvider router={router} /></StrictMode>);
