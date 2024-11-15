import {
  Link,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ConnectButton } from "@mysten/dapp-kit";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
  notFoundComponent: () => {
    return (
      <div>
        <p>This is the notFoundComponent configured on root route</p>
        <Link to="/">Start Over</Link>
      </div>
    );
  },
});

function RootComponent() {
  return (
    <>
      <header className="flex sticky h-16 shrink-0 items-center justify-between gap-2 mb-4 border-b px-4">
        <div className="p-2 flex gap-4 items-center">
          <h1 className="text-3xl font-bold">Sui Blockchain</h1>
          <nav className="flex gap-2 text-lg items-center">
            <Link
              to="/"
              activeProps={{
                className: "font-bold",
              }}
              activeOptions={{ exact: true }}
            >
              Mint NFT
            </Link>{" "}
            <Link
              to="/upload"
              activeProps={{
                className: "font-bold",
              }}
            >
              Walrus
            </Link>{" "}
          </nav>
        </div>
        <ConnectButton />
      </header>

      <Outlet />
      <ReactQueryDevtools buttonPosition="bottom-right" />
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}
