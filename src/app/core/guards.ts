import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Role } from './models';
import { NotificationsService } from './notifications.service';
import { SessionService } from './session.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

export const roleGuard: CanActivateFn = (route) => {
  const allowed = (route.data['roles'] as Role[] | undefined) ?? [];
  const session = inject(SessionService);
  const router = inject(Router);
  const notifications = inject(NotificationsService);

  if (!session.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const role = session.role();
  if (!role || (allowed.length > 0 && !allowed.includes(role))) {
    notifications.error('No tenés permiso para acceder a esa pantalla.');
    return router.createUrlTree(['/tickets']);
  }

  return true;
};
