import { createBrowserRouter } from 'react-router-dom';

import { CourseListPage } from '@/features/courses/pages/course-list-page';
import { HomePage } from '@/features/home/home-page';
import { NotFoundPage } from '@/features/not-found/not-found-page';
import { SpotDetailPage } from '@/features/spots/pages/spot-detail-page';
import { SpotListPage } from '@/features/spots/pages/spot-list-page';
import { AppLayout } from '@/shared/components/app-layout';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/spots',
        element: <SpotListPage />,
      },
      {
        path: '/spots/:id',
        element: <SpotDetailPage />,
      },
      {
        path: '/courses',
        element: <CourseListPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
