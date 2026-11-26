import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';

import { Category, Priority, TicketStatus } from '../../core/models';
import { TicketService } from './ticket.service';

@Component({
  selector: 'app-ticket-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <section class="page stack">
      <header class="row">
        <div>
          <h1>Mis tickets</h1>
          <p class="muted">Filtrá por estado, prioridad o categoría.</p>
        </div>
        <span class="spacer"></span>
        <a mat-flat-button routerLink="/tickets/new">
          <mat-icon>add</mat-icon>
          Nuevo ticket
        </a>
        <a mat-stroked-button routerLink="/tickets/import">
          <mat-icon>upload_file</mat-icon>
          Importar
        </a>
      </header>

      <mat-card>
        <form [formGroup]="form" (ngSubmit)="apply()" class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Estado</mat-label>
            <mat-select formControlName="status">
              <mat-option value="">Todos</mat-option>
              @for (status of statuses; track status) {
                <mat-option [value]="status">{{ status }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Prioridad</mat-label>
            <mat-select formControlName="priority">
              <mat-option value="">Todas</mat-option>
              @for (priority of priorities; track priority) {
                <mat-option [value]="priority">{{ priority }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Categoría</mat-label>
            <mat-select formControlName="category">
              <mat-option value="">Todas</mat-option>
              @for (category of categories; track category) {
                <mat-option [value]="category">{{ category }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <button mat-flat-button type="submit">Aplicar</button>
          <button mat-stroked-button type="button" (click)="clear()">Limpiar</button>
        </form>
      </mat-card>

      @if (loading()) {
        <p class="muted">Cargando tickets…</p>
      } @else {
        <div class="grid">
          @for (ticket of tickets(); track ticket.id) {
            <mat-card class="ticket-card">
              <mat-card-header>
                <mat-card-title>{{ ticket.titulo }}</mat-card-title>
                <mat-card-subtitle>#{{ ticket.id }} · {{ ticket.requesterName }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="row badges">
                  <span class="badge status">{{ ticket.status }}</span>
                  <span class="badge priority">{{ ticket.priority }}</span>
                  <span class="badge">{{ ticket.category }}</span>
                  @if (ticket.source === 'PDF') {
                    <span class="badge">PDF</span>
                  }
                  @if (ticket.source === 'EMAIL') {
                    <span class="badge">EMAIL</span>
                  }
                  @if (ticket.assigneeName) {
                    <span class="muted">Asignado a {{ ticket.assigneeName }}</span>
                  }
                </div>
                @if (ticket.summary) {
                  <p class="summary">{{ ticket.summary }}</p>
                }
                <p class="muted date">Creado {{ ticket.createdAt | date: 'medium' }}</p>
              </mat-card-content>
              <mat-card-actions>
                <a mat-button [routerLink]="['/tickets', ticket.id]">Ver detalle</a>
              </mat-card-actions>
            </mat-card>
          } @empty {
            <p class="muted empty">No hay tickets con esos filtros.</p>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .filters {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      padding: 16px;
    }

    .filters mat-form-field {
      width: 190px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .ticket-card mat-card-title {
      font-size: 1rem;
    }

    .badges {
      margin: 8px 0;
    }

    .badge {
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid var(--mat-sys-outline-variant);
      font-size: 0.72rem;
    }

    .status {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }

    .priority {
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }

    .summary {
      font-size: 0.85rem;
      margin: 8px 0;
    }

    .date {
      font-size: 0.75rem;
      margin: 0;
    }

    .empty {
      grid-column: 1 / -1;
    }
  `,
})
export class TicketListPage implements OnInit {
  private readonly ticketsService = inject(TicketService);

  readonly tickets = this.ticketsService.tickets;
  readonly loading = this.ticketsService.loading;
  readonly statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  readonly priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  readonly categories: Category[] = ['BILLING', 'TECHNICAL', 'ACCOUNT', 'OTHER'];

  readonly form = new FormGroup({
    status: new FormControl<TicketStatus | ''>('', { nonNullable: true }),
    priority: new FormControl<Priority | ''>('', { nonNullable: true }),
    category: new FormControl<Category | ''>('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.apply();
  }

  apply(): void {
    this.ticketsService.list(this.form.getRawValue()).subscribe();
  }

  clear(): void {
    this.form.reset({ status: '', priority: '', category: '' });
    this.apply();
  }
}
