import { AuthLoading, Authenticated, Unauthenticated } from 'convex/react'
import { Navigate, Outlet, createBrowserRouter } from 'react-router'
import { Layout } from './components/Layout'
import { RouteError } from './components/RouteError'
import { Spinner } from './components/Spinner'
import { CookingPage } from './pages/CookingPage'
import { NotFound } from './pages/NotFound'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipeEditorPage } from './pages/RecipeEditorPage'
import { RecipeListPage } from './pages/RecipeListPage'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'

function RequireAuth() {
  return (
    <>
      <AuthLoading>
        <Spinner fullScreen />
      </AuthLoading>
      <Unauthenticated>
        <Navigate to="/sign-in" replace />
      </Unauthenticated>
      <Authenticated>
        <Outlet />
      </Authenticated>
    </>
  )
}

export const router = createBrowserRouter([
  { path: '/sign-in/*', element: <SignInPage />, errorElement: <RouteError /> },
  { path: '/sign-up/*', element: <SignUpPage />, errorElement: <RouteError /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      { path: '/receta/:id/cocinar', element: <CookingPage /> },
      {
        element: <Layout />,
        children: [
          { path: '/', element: <RecipeListPage /> },
          { path: '/receta/nueva', element: <RecipeEditorPage /> },
          { path: '/receta/:id', element: <RecipeDetailPage /> },
          { path: '/receta/:id/editar', element: <RecipeEditorPage /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
])
