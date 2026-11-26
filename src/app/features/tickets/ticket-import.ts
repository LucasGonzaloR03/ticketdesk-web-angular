import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';

import { Category, Priority, TicketEmailPreview, TicketImportPreview } from '../../core/models';
import { TicketService } from './ticket.service';

type Modo = 'PDF' | 'EMAIL';

@Component({
  selector: 'app-ticket-import',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    RouterLink,
  ],
  template: `
    <section class="page">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Importar ticket</mat-card-title>
          <mat-card-subtitle>
            Desde un PDF o un correo .eml. Revisá los campos sugeridos antes de crear.
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="row modos">
            <button mat-button type="button" [class.activo]="modo() === 'PDF'" (click)="cambiarModo('PDF')">
              PDF
            </button>
            <button mat-button type="button" [class.activo]="modo() === 'EMAIL'" (click)="cambiarModo('EMAIL')">
              Correo .eml
            </button>
          </div>

          <div class="stack form">
            <input
              type="file"
              [attr.accept]="modo() === 'PDF' ? 'application/pdf,.pdf' : '.eml,message/rfc822'"
              (change)="seleccionar($event)"
            />
            <div class="row">
              <button mat-flat-button type="button" (click)="analizar()" [disabled]="!archivo || analyzing()">
                {{ modo() === 'PDF' ? 'Analizar PDF' : 'Analizar correo' }}
              </button>
              @if (analyzing()) {
                <span class="muted">Extrayendo datos…</span>
              }
            </div>
          </div>

          @if (preview(); as datos) {
            <form [formGroup]="form" (ngSubmit)="confirmar()" class="stack form">
              <p class="muted">{{ resumen() }}</p>
              @if (datos.provider) {
                <p class="sugerencia">Sugerido por {{ datos.provider }} · revisá los campos antes de crear.</p>
              }

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Título</mat-label>
                <input matInput formControlName="titulo" maxlength="255" />
                @if (form.controls.titulo.invalid && form.controls.titulo.touched) {
                  <mat-error>El título es obligatorio.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Descripción</mat-label>
                <textarea matInput formControlName="descripcion" rows="8"></textarea>
                @if (form.controls.descripcion.invalid && form.controls.descripcion.touched) {
                  <mat-error>La descripción es obligatoria.</mat-error>
                }
              </mat-form-field>

              <div class="row">
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
                <button mat-flat-button type="submit">Crear ticket</button>
                <a mat-button routerLink="/tickets">Cancelar</a>
              </div>
            </form>
          }
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: `
    .form {
      padding-top: 16px;
    }

    .modos {
      padding-top: 8px;
    }

    .activo {
      font-weight: 600;
      text-decoration: underline;
    }

    .sugerencia {
      margin: 0;
      font-size: 14px;
      color: var(--mat-sys-primary, #3f51b5);
    }
  `,
})
export class TicketImportPage {
  private readonly ticketsService = inject(TicketService);
  private readonly router = inject(Router);

  readonly priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  readonly categories: Category[] = ['BILLING', 'TECHNICAL', 'ACCOUNT', 'OTHER'];

  readonly modo = signal<Modo>('PDF');
  readonly analyzing = signal(false);
  readonly preview = signal<TicketImportPreview | TicketEmailPreview | null>(null);
  readonly resumen = signal('');
  archivo: File | null = null;

  readonly form = new FormGroup({
    titulo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(255)] }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    priority: new FormControl<Priority>('MEDIUM', { nonNullable: true }),
    category: new FormControl<Category>('OTHER', { nonNullable: true }),
  });

  cambiarModo(modo: Modo): void {
    this.modo.set(modo);
    this.archivo = null;
    this.preview.set(null);
    this.resumen.set('');
  }

  seleccionar(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivo = input.files?.[0] ?? null;
    this.preview.set(null);
    this.resumen.set('');
  }

  analizar(): void {
    if (!this.archivo) {
      return;
    }
    this.analyzing.set(true);
    if (this.modo() === 'EMAIL') {
      this.ticketsService.importEmail(this.archivo).subscribe((datos) => this.aplicarPreview(datos));
    } else {
      this.ticketsService.importPdf(this.archivo).subscribe((datos) => this.aplicarPreview(datos));
    }
  }

  confirmar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const source = this.modo() === 'EMAIL' ? 'EMAIL' : 'PDF';
    this.ticketsService.create({ ...this.form.getRawValue(), source }).subscribe((created) => {
      if (created) {
        this.router.navigate(['/tickets', created.id]);
      }
    });
  }

  private aplicarPreview(datos: TicketImportPreview | TicketEmailPreview | null): void {
    this.analyzing.set(false);
    if (!datos) {
      return;
    }
    this.preview.set(datos);
    this.form.setValue({
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      priority: datos.priority,
      category: datos.category,
    });
    this.resumen.set(this.resumenDe(datos));
  }

  private resumenDe(datos: TicketImportPreview | TicketEmailPreview): string {
    const partes = [datos.nombreArchivo ?? 'archivo'];
    if ('paginas' in datos) {
      partes.push(`${datos.paginas} página(s)`);
    }
    partes.push(`${datos.caracteres} caracteres`);
    if ('adjuntos' in datos) {
      partes.push(`${datos.adjuntos} adjunto(s)`);
      if (datos.remitente) {
        partes.push(`De: ${datos.remitente}`);
      }
      if (datos.fecha) {
        partes.push(`Fecha: ${datos.fecha}`);
      }
    }
    if (datos.recortado) {
      partes.push('texto recortado');
    }
    return partes.join(' · ');
  }
}
