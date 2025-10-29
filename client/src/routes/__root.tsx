import { createRootRoute, Outlet } from "@tanstack/react-router";

const RootLayout = () => (
  <>
    {/* <div className="p-2 flex gap-2">
      <Link to="/" className="[&.active]:font-bold">
        Home
      </Link>{" "}
      <Link to="/dashboard" className="[&.active]:font-bold">
        Dashboard
      </Link>
    </div>
    <hr /> */}
    <Outlet />
    {/* <TanStackRouterDevtools /> */}
  </>
);

export const Route = createRootRoute({ component: RootLayout });
