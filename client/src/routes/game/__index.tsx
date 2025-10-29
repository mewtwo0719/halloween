import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/game/__index')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/game/layout"!</div>
}
