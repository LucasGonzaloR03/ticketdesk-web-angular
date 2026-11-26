import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';

import { AiSettingsService } from './ai-settings.service';

@Component({
  selector: 'app-ai-settings-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <section class="page">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Configuración de IA</mat-card-title>
          <mat-card-subtitle>
            La clave se cifra con AES-GCM; la API sólo devuelve una pista.
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (settings(); as current) {
            <div class="current">
              <b>{{ current.provider }}</b>
              @if (current.model) {
                <span>· {{ current.model }}</span>
              }
              @if (current.keyHint) {
                <span class="muted">· clave {{ current.keyHint }}</span>
              }
              @if (current.updatedAt) {
                <span class="muted">· actualizado {{ current.updatedAt | date: 'medium' }}</span>
              }
            </div>
          } @else {
            <p class="muted">Todavía no guardaste una configuración.</p>
          }

          <form [formGroup]="form" (ngSubmit)="save()" class="stack form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Provider</mat-label>
              <input matInput formControlName="provider" placeholder="mock / openai" />
              @if (form.controls.provider.invalid && form.controls.provider.touched) {
                <mat-error>El provider es obligatorio.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Modelo (opcional)</mat-label>
              <input matInput formControlName="model" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Api key</mat-label>
              <input matInput type="password" formControlName="apiKey" autocomplete="off" />
              @if (form.controls.apiKey.invalid && form.controls.apiKey.touched) {
                <mat-error>Necesitás una clave para guardar.</mat-error>
              }
            </mat-form-field>

            <div class="row">
              <button mat-flat-button type="submit">Guardar</button>
              <button mat-stroked-button type="button" (click)="remove()">Eliminar configuración</button>
              <a mat-button routerLink="/tickets">Volver</a>
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

    .current {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      background: var(--mat-sys-surface-container-low);
      margin-top: 12px;
    }
  `,
})
export class AiSettingsPage implements OnInit {
  private readonly settingsService = inject(AiSettingsService);

  readonly settings = this.settingsService.settings;

  readonly form = new FormGroup({
    provider: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    model: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    apiKey: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(512)] }),
  });

  ngOnInit(): void {
    this.settingsService.load().subscribe((settings) => {
      if (settings) {
        this.form.reset({
          provider: settings.provider,
          model: settings.model ?? '',
          apiKey: '',
        });
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { provider, model, apiKey } = this.form.getRawValue();
    this.settingsService
      .save({ provider, model: model || undefined, apiKey })
      .subscribe(() => this.form.controls.apiKey.reset(''));
  }

  remove(): void {
    if (!window.confirm('¿Eliminar la configuración de IA?')) {
      return;
    }
    this.settingsService.remove().subscribe();
  }
}
