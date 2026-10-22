import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RouteError } from '@/components/layout/RouteError';
import { RequireAuth } from '@/features/auth/RequireAuth';

// Route-level code splitting keeps the calendar and chart libraries out of the initial bundle.
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const CalendarPage = lazy(() => import('@/features/appointments/CalendarPage'));
const CustomersPage = lazy(() => import('@/features/customers/CustomersPage'));
const CustomerDetailPage = lazy(() => import('@/features/customers/CustomerDetailPage'));
const ServicesPage = lazy(() => import('@/features/services/ServicesPage'));
const StaffPage = lazy(() => import('@/features/staff/StaffPage'));
const NotificationsPage = lazy(() => import('@/features/notifications/NotificationsPage'));

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'customers/:id', element: <CustomerDetailPage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'staff', element: <StaffPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
