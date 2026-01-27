import { Route, Switch } from 'wouter'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LightStudioProvider } from './contexts/LightStudioContext'
import Header from './components/Header'
import LightStudio from './components/LightStudio'
import Landing from './pages/Landing'
import Products from './pages/Products'
import Order from './pages/Order'
import Login from './pages/Login'
import Register from './pages/Register'
import Orders from './pages/Orders'
import Admin from './pages/Admin'
import AdminOrders from './pages/AdminOrders'
import AdminUsers from './pages/AdminUsers'
import AdminCategories from './pages/AdminCategories'
import AdminProductCategories from './pages/AdminProductCategories'
import AdminPointsShop from './pages/AdminPointsShop'
import PointsShop from './pages/PointsShop'
import Leaderboard from './pages/Leaderboard'
import EditOrder from './pages/EditOrder'
import './index.css'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LightStudioProvider>
        <div className="min-h-screen bg-[#1a1a1a] text-[#e5e5e5]">
          <Header />
          <Switch>
            <Route path="/" component={Landing} />
            <Route path="/products" component={Products} />
            <Route path="/order" component={Order} />
            <Route path="/order/edit/:id" component={EditOrder} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/orders" component={Orders} />
            <Route path="/points-shop" component={PointsShop} />
            <Route path="/leaderboard" component={Leaderboard} />
            <Route path="/admin" component={Admin} />
            <Route path="/admin/orders" component={AdminOrders} />
            <Route path="/admin/users" component={AdminUsers} />
            <Route path="/admin/categories" component={AdminCategories} />
            <Route path="/admin/product-categories" component={AdminProductCategories} />
            <Route path="/admin/points-shop" component={AdminPointsShop} />
            <Route>404 - Not Found</Route>
          </Switch>
        </div>
        <LightStudio />
      </LightStudioProvider>
    </QueryClientProvider>
  )
}

export default App

