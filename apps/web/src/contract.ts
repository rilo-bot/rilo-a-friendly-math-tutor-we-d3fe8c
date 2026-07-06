/**
 * AUTO-GENERATED API CONTRACT — DO NOT EDIT (the engine regenerates this from the plan every
 * build wave; hand edits are overwritten). Import the route map and call these EXACT paths and
 * methods; the request/response field names are documented on each route. The frontend and the
 * backend both ship this same module — it is the agreement that keeps them connected.
 */

export interface ApiRoute {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
}

export const API_ROUTES = {
  /**
   * Take a student's typed math problem and return a structured step-by-step worked solution.
   * request:  { problem: string }
   * response: { id: string; problem: string; steps: { explanation: string; expression?: string }[]; finalAnswer: string; createdAt: string }
   */
  POST_API_SOLVE: { method: 'POST', path: '/api/solve' },
} as const;

export type ApiRouteKey = keyof typeof API_ROUTES;

/** Fill `:param` segments in a route path, e.g. routePath(API_ROUTES.GET_API_LEADS_ID, { id }) */
export function routePath(route: ApiRoute, params: Record<string, string | number> = {}): string {
  return route.path.replace(/:([A-Za-z0-9_]+)/g, (_, name: string) =>
    encodeURIComponent(String(params[name] ?? `:${name}`))
  );
}
