import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import Loadable from '../layouts/full/shared/loadable/Loadable';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

/* ****Pages***** */
const Dashboard = Loadable(lazy(() => import('../views/dashboard/Dashboard')))
const Error = Loadable(lazy(() => import('../views/authentication/Error')));
const Login = Loadable(lazy(() => import('../views/authentication/Login')));
const Logout = Loadable(lazy(() => import('../views/authentication/Logout')));
const Checklist = Loadable(lazy(() => import('../views/checklist/Checklist')));
const DeployPage = Loadable(lazy(() => import('../views/form/DeployPage')));
const ConceptifyApp = Loadable(lazy(() => import('../views/conceptify/App')));
const ControlPanel = Loadable(lazy(() => import('../views/control-panel/ControlPanel')));
const Store = Loadable(lazy(() => import('../views/store/Store')));

const Router = [
  {
    path: '/conceptify',
    element: <ConceptifyApp />,
  },
  {
    path: '/',
    element: <FullLayout />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" /> },
      { path: '/checklist', exact: true, element: <Checklist /> },
      { path: '/dashboard', exact: true, element: <Dashboard /> },
      { path: '/form', exact: true, element: <DeployPage /> },
      { path: '/control-panel', exact: true, element: <ControlPanel /> },
      { path: '/apps', exact: true, element: <Store /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/auth',
    element: <BlankLayout />,
    children: [
      { path: '404', element: <Error /> },
      { path: '/auth/login', element: <Login /> },
      { path: '/auth/logout', element: <Logout /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
];

export default Router;
