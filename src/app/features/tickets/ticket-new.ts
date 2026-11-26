import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';

import { Category, Priority } from '../../core/models';
import { TicketService } from './ticket.service';

@Component({
  selector: 'app-ticket-new',
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
          <mat-card-title>Nuevo ticket</mat-card-title>
          <mat-card-subtitle>La descripción se usa también para detectar duplicados.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="stack form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Título</mat-label>
              <input matInput formControlName="titulo" maxlength="255" />
              @if (form.controls.titulo.invalid && form.controls.titulo.touched) {
                <mat-error>El título es obligatorio.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Descripción</mat-label>
              <textarea matInput formControlName="descripcion" rows="6"></textarea>
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
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: `
    .form {
      padding-top: 16px;
    }
  `,
})
export class TicketNewPage {
  private readonly ticketsService = inject(TicketService);
  private readonly router = inject(Router);

  readonly priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  readonly categories: Category[] = ['BILLING', 'TECHNICAL', 'ACCOUNT', 'OTHER'];

  readonly form = new FormGroup({
    titulo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(255)] }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    priority: new FormControl<Priority>('MEDIUM', { nonNullable: true }),
    category: new FormControl<Category>('TECHNICAL', { nonNullable: true }),
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.ticketsService.create(this.form.getRawValue()).subscribe((created) => {
      if (created) {
        this.router.navigate(['/tickets', created.id]);
      }
    });
  }
}
