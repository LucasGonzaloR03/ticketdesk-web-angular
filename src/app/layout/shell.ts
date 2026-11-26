import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../core/auth.service';
import { SessionService } from '../core/session.service';
import { HealthService } from '../features/settings/health.service';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <a class="brand" routerLink="/tickets">TicketDesk <strong>AI</strong></a>

      <nav class="nav" aria-label="Navegación principal">
        <a mat-button routerLink="/tickets" routerLinkActive="active">Mis tickets</a>
        <a mat-button routerLink="/tickets/new" routerLinkActive="active">Nuevo</a>
        @if (isAgent()) {
          <a mat-button routerLink="/agent" routerLinkActive="active">Panel agente</a>
        }
        <a mat-button routerLink="/settings/ai" routerLinkActive="active">Config. IA</a>
      </nav>

      <span class="spacer"></span>

      <button mat-button [matMenuTriggerFor]="userMenu">
        <mat-icon>account_circle</mat-icon>
        {{ user()?.name }}
      </button>
      <mat-menu #userMenu="matMenu">
        <div class="menu-info">{{ user()?.email }} · {{ user()?.role }}</div>
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon>
          <span>Cerrar sesión</span>
        </button>
      </mat-menu>
    </mat-toolbar>

    <main class="content">
      <router-outlet />
    </main>

    <footer class="footer">
      <span>TicketDesk AI · Angular + Spring Boot</span>
      <span class="health">
        API /health:
        @if (healthStatus() === 'up') {
          <b class="up">UP</b>
        } @else if (healthStatus() === 'checking') {
          <b>verificando…</b>
        } @else {
          <b class="down">sin conexión</b>
        }
      </span>
    </footer>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      gap: 8px;
    }

    .brand {
      color: inherit;
      text-decoration: none;
      font-size: 1.1rem;
      letter-spacing: 0.02em;
      margin-right: 16px;
    }

    .brand strong {
      color: var(--mat-sys-tertiary);
    }

    .nav {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .active {
      text-decoration: underline;
      text-underline-offset: 6px;
    }

    .content {
      flex: 1;
      width: 100%;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px 24px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .menu-info {
      padding: 8px 16px;
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .up {
      color: #1b8a3a;
    }

    .down {
      color: var(--mat-sys-error);
    }

    @media (max-width: 720px) {
      .nav {
        display: none;
      }
    }
  `,
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly health = inject(HealthService);
  private readonly session = inject(SessionService);

  readonly user = this.session.currentUser;
  readonly isAgent = this.session.isAgent;
  readonly healthStatus = this.health.status;

  constructor() {
    this.health.check();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
