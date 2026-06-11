import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { authApi } from "./api";
import { AuthContext, useAuthState } from "./hooks/useAuth";
import { BuilderPage } from "./pages/BuilderPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { PublicSurveyPage } from "./pages/PublicSurveyPage";
import { ResponsesPage } from "./pages/ResponsesPage";
import { VerifyPage } from "./pages/VerifyPage";

// ─── Root route with auth provider ─────────────────────────────────────────
function RootComponent() {
  const auth = useAuthState();
  return (
    <AuthContext.Provider value={auth}>
      <Outlet />
    </AuthContext.Provider>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

// ─── Public routes ──────────────────────────────────────────────────────────
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const verifyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify",
  component: VerifyPage,
  validateSearch: (search: Record<string, string>) => ({
    token: search.token,
  }),
});

const publicSurveyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/s/$surveyId",
  component: PublicSurveyPage,
});

// ─── Protected routes ────────────────────────────────────────────────────────
async function guardAuth() {
  const res = await authApi.me();
  if (!res.ok) {
    throw redirect({ to: "/login" });
  }
}

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  beforeLoad: guardAuth,
  component: DashboardPage,
});

const builderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/builder/$id",
  beforeLoad: guardAuth,
  component: BuilderPage,
});

const responsesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/surveys/$id/responses",
  beforeLoad: guardAuth,
  component: ResponsesPage,
});

// Root redirect
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: async () => {
    const res = await authApi.me();
    if (res.ok) {
      throw redirect({ to: "/dashboard" });
    }
    throw redirect({ to: "/login" });
  },
  component: () => null,
});

// ─── Router ─────────────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  verifyRoute,
  publicSurveyRoute,
  dashboardRoute,
  builderRoute,
  responsesRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return <RouterProvider router={router} />;
}
