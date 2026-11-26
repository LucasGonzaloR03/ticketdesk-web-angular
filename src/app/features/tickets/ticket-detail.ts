import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AiService } from '../ai/ai.service';
import { Category, Priority, TicketStatus } from '../../core/models';
import { SessionService } from '../../core/session.service';
import { TicketService } from './ticket.service';

@Component({
  selector: 'app-ticket-detail',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
  ],
  template: `
    <section class="page stack">
      <a mat-button routerLink="/tickets"><mat-icon>arrow_back</mat-icon> Volver</a>

      @if (ticket(); as current) {
        <mat-card>
          <mat-card-header>
            <mat-card-title>{{ current.titulo }}</mat-card-title>
            <mat-card-subtitle>
              #{{ current.id }} · {{ current.requesterName }} · {{ current.createdAt | date: 'medium' }}
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="row badges">
              <span class="badge">{{ current.status }}</span>
              <span class="badge">{{ current.priority }}</span>
              <span class="badge">{{ current.category }}</span>
              @if (current.assigneeName) {
                <span class="muted">Asignado a {{ current.assigneeName }}</span>
              } @else {
                <span class="muted">Sin asignar</span>
              }
            </div>
            <p>{{ current.descripcion }}</p>
            @if (current.summary) {
              <blockquote><b>Resumen IA:</b> {{ current.summary }}</blockquote>
            }
          </mat-card-content>
        </mat-card>

        <mat-tab-group>
          <mat-tab label="Comentarios">
            <div class="tab-content stack">
              @for (comment of comments(); track comment.id) {
                <mat-card class="comment">
                  <mat-card-subtitle>
                    {{ comment.authorName }} · {{ comment.createdAt | date: 'medium' }}
                    @if (comment.internal) {
                      <span class="internal">· interno</span>
                    }
                  </mat-card-subtitle>
                  <mat-card-content>{{ comment.body }}</mat-card-content>
                </mat-card>
              } @empty {
                <p class="muted">Todavía no hay comentarios.</p>
              }

              <mat-card>
                <mat-card-content>
                  <form [formGroup]="commentForm" (ngSubmit)="addComment()" class="stack">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Nuevo comentario</mat-label>
                      <textarea matInput formControlName="body" rows="3"></textarea>
                      @if (commentForm.controls.body.invalid && commentForm.controls.body.touched) {
                        <mat-error>Escribí algo antes de enviar.</mat-error>
                      }
                    </mat-form-field>
                    @if (isAgent()) {
                      <label class="check">
                        <input type="checkbox" formControlName="internal" />
                        Comentario interno (sólo agentes)
                      </label>
                    }
                    <button mat-flat-button type="submit">Comentar</button>
                  </form>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          @if (isAgent()) {
            <mat-tab label="Gestión">
              <div class="tab-content">
                <mat-card>
                  <mat-card-content>
                    <form [formGroup]="editForm" (ngSubmit)="saveChanges()" class="stack">
                      <div class="row">
                        <mat-form-field appearance="outline">
                          <mat-label>Estado</mat-label>
                          <mat-select formControlName="status">
                            @for (status of statuses; track status) {
                              <mat-option [value]="status">{{ status }}</mat-option>
                            }
                          </mat-select>
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Prioridad</mat-label>
                          <mat-select formControlName="priority">
                            @for (priority of priorities; track priority) {
                              <mat-option [value]="priority">{{ priority }}</mat-option>
                            }
                          </mat-select>
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Categoría</mat-label>
                          <mat-select formControlName="category">
                            @for (category of categories; track category) {
                              <mat-option [value]="category">{{ category }}</mat-option>
                            }
                          </mat-select>
                        </mat-form-field>
                      </div>
                      <div class="row">
                        <button mat-flat-button type="submit">Guardar cambios</button>
                        @if (current.assigneeId !== session.userId()) {
                          <button mat-stroked-button type="button" (click)="take()">Tomar ticket</button>
                        }
                        <button mat-stroked-button type="button" (click)="remove()">Eliminar</button>
                      </div>
                    </form>
                  </mat-card-content>
                </mat-card>
              </div>
            </mat-tab>

            <mat-tab label="Historial">
              <div class="tab-content stack">
                @for (event of events(); track event.id) {
                  <div class="event">
                    <b>{{ event.type }}</b>
                    <span class="muted">· actor #{{ event.actorId }} · {{ event.createdAt | date: 'medium' }}</span>
                    @if (event.oldValue || event.newValue) {
                      <div>{{ event.oldValue || '—' }} → {{ event.newValue || '—' }}</div>
                    }
                  </div>
                } @empty {
                  <p class="muted">Sin eventos registrados.</p>
                }
              </div>
            </mat-tab>

            <mat-tab label="IA">
              <div class="tab-content stack">
                <div class="row">
                  <button mat-flat-button [disabled]="ai.busy()" (click)="classify()">Clasificar</button>
                  <button mat-flat-button [disabled]="ai.busy()" (click)="summarize()">Resumir</button>
                  <button mat-flat-button [disabled]="ai.busy()" (click)="suggest()">Sugerir respuesta</button>
                </div>

                @if (ai.classification(); as result) {
                  <mat-card>
                    <mat-card-content>
                      <b>Clasificación:</b> {{ result.categoria }} / {{ result.prioridad }}
                      <p class="muted">{{ result.motivo }} · provider: {{ result.provider }}</p>
                    </mat-card-content>
                  </mat-card>
                }
                @if (ai.summaryResult(); as result) {
                  <mat-card>
                    <mat-card-content>
                      <b>Resumen:</b> {{ result.resumen }}
                      <p class="muted">provider: {{ result.provider }}</p>
                    </mat-card-content>
                  </mat-card>
                }
                @if (ai.reply(); as result) {
                  <mat-card>
                    <mat-card-content>
                      <b>Borrador:</b>
                      <p>{{ result.borrador }}</p>
                      <p class="muted">provider: {{ result.provider }}</p>
                    </mat-card-content>
                  </mat-card>
                }
              </div>
            </mat-tab>

            <mat-tab label="Duplicados">
              <div class="tab-content stack">
                @for (duplicate of duplicates(); track duplicate.id) {
                  <a class="duplicate" [routerLink]="['/tickets', duplicate.id]">
                    <b>#{{ duplicate.id }} · {{ duplicate.titulo }}</b>
                    <span class="muted">
                      {{ duplicate.status }} · {{ duplicate.priority }} · similitud
                      {{ duplicate.similitud | number: '1.2-2' }}
                    </span>
                  </a>
                } @empty {
                  <p class="muted">No se encontraron tickets similares.</p>
                }
              </div>
            </mat-tab>
          }
        </mat-tab-group>
      } @else {
        <p class="muted">Cargando ticket…</p>
      }
    </section>
  `,
  styles: `
    .tab-content {
      padding: 16px 4px;
    }

    .badges {
      margin-bottom: 8px;
    }

    .badge {
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid var(--mat-sys-outline-variant);
      font-size: 0.72rem;
    }

    blockquote {
      margin: 12px 0 0;
      padding: 8px 12px;
      border-left: 3px solid var(--mat-sys-primary);
      background: var(--mat-sys-surface-container-low);
    }

    .comment mat-card-content {
      white-space: pre-wrap;
    }

    .internal {
      color: var(--mat-sys-error);
    }

    .check {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .event,
    .duplicate {
      padding: 10px 12px;
      border-radius: 8px;
      background: var(--mat-sys-surface-container-low);
    }

    .duplicate {
      display: flex;
      flex-direction: column;
      gap: 4px;
      color: inherit;
      text-decoration: none;
    }

    .event .muted,
    .duplicate .muted {
      font-size: 0.78rem;
    }

    @media (max-width: 720px) {
      .tab-content {
        padding: 12px 0;
      }

      .badges {
        gap: 6px;
      }
    }
  `,
})
export class TicketDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ticketsService = inject(TicketService);

  readonly ai = inject(AiService);
  readonly session = inject(SessionService);

  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly ticket = this.ticketsService.ticket;
  readonly comments = this.ticketsService.comments;
  readonly events = this.ticketsService.events;
  readonly duplicates = this.ticketsService.duplicates;
  readonly isAgent = this.session.isAgent;

  readonly statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  readonly priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  readonly categories: Category[] = ['BILLING', 'TECHNICAL', 'ACCOUNT', 'OTHER'];

  readonly commentForm = new FormGroup({
    body: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    internal: new FormControl(false, { nonNullable: true }),
  });

  readonly editForm = new FormGroup({
    status: new FormControl<TicketStatus>('OPEN', { nonNullable: true }),
    priority: new FormControl<Priority>('MEDIUM', { nonNullable: true }),
    category: new FormControl<Category>('TECHNICAL', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.ticketsService.detail(this.id).subscribe((ticket) => {
      if (ticket) {
        this.editForm.reset({
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category,
        });
      }
    });
    this.ticketsService.loadComments(this.id).subscribe();

    if (this.isAgent()) {
      this.ticketsService.loadEvents(this.id).subscribe();
      this.ticketsService.loadDuplicates(this.id).subscribe();
    }
  }

  addComment(): void {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }
    this.ticketsService
      .addComment(this.id, this.commentForm.getRawValue())
      .subscribe((created) => {
        if (created) {
          this.commentForm.reset({ body: '', internal: false });
        }
      });
  }

  saveChanges(): void {
    this.ticketsService.patch(this.id, this.editForm.getRawValue()).subscribe();
  }

  take(): void {
    const userId = this.session.userId();
    if (userId !== null) {
      this.ticketsService.assign(this.id, { assigneeId: userId }).subscribe();
    }
  }

  remove(): void {
    if (!window.confirm('¿Eliminar este ticket?')) {
      return;
    }
    this.ticketsService.remove(this.id).subscribe((ok) => {
      if (ok) {
        this.router.navigate(['/tickets']);
      }
    });
  }

  classify(): void {
    this.ai.classify(this.id).subscribe();
  }

  summarize(): void {
    this.ai.summarize(this.id).subscribe((result) => {
      if (result) {
        this.ticketsService.detail(this.id).subscribe();
      }
    });
  }

  suggest(): void {
    this.ai.suggestReply(this.id).subscribe();
  }
}
