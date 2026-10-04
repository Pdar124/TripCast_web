import { createBrowserRouter } from 'react-router-dom';

import { CourseDetailPage } from '@/features/courses/pages/course-detail-page';
import { ClimatePage } from '@/features/climate/pages/climate-page';
import { CourseListPage } from '@/features/courses/pages/course-list-page';
import { RecommendationPage } from '@/features/courses/pages/recommendation-page';
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
        path: '/courses/:id',
        element: <CourseDetailPage />,
      },
      {
        path: '/recommendations',
        element: <RecommendationPage />,
      },
      {
        path: '/climate',
        element: <ClimatePage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
