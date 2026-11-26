import { Routes } from '@angular/router';

import { authGuard, roleGuard } from './core/guards';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: 'login',
    data: { mode: 'login' },
    loadComponent: () => import('./features/auth/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'register',
    data: { mode: 'register' },
    loadComponent: () => import('./features/auth/auth-page').then((m) => m.AuthPage),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tickets' },
      {
        path: 'tickets',
        loadComponent: () => import('./features/tickets/ticket-list').then((m) => m.TicketListPage),
      },
      {
        path: 'tickets/new',
        loadComponent: () => import('./features/tickets/ticket-new').then((m) => m.TicketNewPage),
      },
      {
        path: 'tickets/import',
        loadComponent: () => import('./features/tickets/ticket-import').then((m) => m.TicketImportPage),
      },
      {
        path: 'tickets/:id',
        loadComponent: () => import('./features/tickets/ticket-detail').then((m) => m.TicketDetailPage),
      },
      {
        path: 'agent',
        canActivate: [roleGuard],
        data: { roles: ['AGENT', 'ADMIN'] },
        loadComponent: () => import('./features/agent/agent-dashboard').then((m) => m.AgentDashboardPage),
      },
      {
        path: 'settings/ai',
        loadComponent: () => import('./features/settings/ai-settings-page').then((m) => m.AiSettingsPage),
      },
    ],
  },
  { path: '**', redirectTo: 'tickets' },
];
