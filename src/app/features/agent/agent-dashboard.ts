import { Component, computed, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { SessionService } from '../../core/session.service';
import { TicketResponse } from '../../core/models';
import { TicketService } from '../tickets/ticket.service';

@Component({
  selector: 'app-agent-dashboard',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <section class="page stack">
      <header class="row">
        <div>
          <h1>Panel del agente</h1>
          <p class="muted">Tickets abiertos o en progreso que podés ver.</p>
        </div>
      </header>

      <div class="grid">
        @for (ticket of tickets(); track ticket.id) {
          <mat-card>
            <mat-card-header>
              <mat-card-title>{{ ticket.titulo }}</mat-card-title>
              <mat-card-subtitle>#{{ ticket.id }} · {{ ticket.requesterName }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p class="row badges">
                <span class="badge">{{ ticket.status }}</span>
                <span class="badge">{{ ticket.priority }}</span>
                <span class="badge">{{ ticket.category }}</span>
              </p>
            </mat-card-content>
            <mat-card-actions>
              @if (ticket.assigneeId === session.userId()) {
                <span class="muted">Tomado por vos</span>
              } @else {
                <button mat-stroked-button (click)="take(ticket)">Tomar</button>
              }
              <a mat-button [routerLink]="['/tickets', ticket.id]">Abrir</a>
              @if (ticket.status !== 'RESOLVED') {
                <button mat-button (click)="resolve(ticket)">Resolver</button>
              }
            </mat-card-actions>
          </mat-card>
        } @empty {
          <p class="muted">No hay tickets pendientes.</p>
        }
      </div>
    </section>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
      gap: 16px;
    }

    .badge {
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid var(--mat-sys-outline-variant);
      font-size: 0.72rem;
    }

    @media (max-width: 720px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class AgentDashboardPage implements OnInit {
  private readonly ticketsService = inject(TicketService);
  readonly session = inject(SessionService);

  private readonly allTickets = this.ticketsService.tickets;
  readonly tickets = computed(() =>
    this.allTickets().filter((ticket) => ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS'),
  );

  ngOnInit(): void {
    this.ticketsService.list().subscribe();
  }

  take(ticket: TicketResponse): void {
    const userId = this.session.userId();
    if (userId !== null) {
      this.ticketsService.assign(ticket.id, { assigneeId: userId }).subscribe();
    }
  }

  resolve(ticket: TicketResponse): void {
    this.ticketsService.patch(ticket.id, { status: 'RESOLVED' }).subscribe();
  }
}
