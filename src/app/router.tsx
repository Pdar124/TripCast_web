import { createBrowserRouter } from 'react-router-dom';

import { HomePage } from '@/features/home/home-page';
import { NotFoundPage } from '@/features/not-found/not-found-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
