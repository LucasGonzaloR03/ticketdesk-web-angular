import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AiSettingsService, sugerirProviderPorClave } from './ai-settings.service';

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
    MatSelectModule,
  ],
  template: `
    <section class="page">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Configuración de IA</mat-card-title>
          <mat-card-subtitle>
            Elegí proveedor y modelo. La clave se cifra con AES-GCM; la API sólo devuelve una pista.
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
              <mat-select formControlName="provider" (selectionChange)="cambioProvider($event.value)">
                @for (p of catalog(); track p.id) {
                  <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
                }
              </mat-select>
              @if (provider(); as p) {
                <mat-hint>{{ p.descripcion }}</mat-hint>
              }
            </mat-form-field>

            @if (modelos().length > 0) {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Modelo</mat-label>
                <mat-select formControlName="model">
                  @for (modelo of modelos(); track modelo) {
                    <mat-option [value]="modelo">{{ modelo }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }

            @if (requiereClave()) {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Api key</mat-label>
                <input
                  matInput
                  type="password"
                  formControlName="apiKey"
                  autocomplete="off"
                  (input)="alEscribirClave()"
                />
                @if (form.controls.apiKey.invalid && form.controls.apiKey.touched) {
                  <mat-error>Necesitás una clave para guardar.</mat-error>
                }
              </mat-form-field>

              @if (sugerencia(); as id) {
                <div class="sugerencia">
                  <span>La clave parece ser de {{ nombreProveedor(id) }}.</span>
                  <button mat-button type="button" (click)="aplicarSugerencia()">
                    Usar {{ nombreProveedor(id) }}
                  </button>
                </div>
              }
            } @else {
              <p class="muted">Este proveedor no necesita clave.</p>
            }

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

    .sugerencia {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding: 8px 12px;
      border-radius: 8px;
      background: var(--mat-sys-surface-container-low);
    }
  `,
})
export class AiSettingsPage implements OnInit {
  private readonly settingsService = inject(AiSettingsService);

  readonly settings = this.settingsService.settings;
  readonly catalog = this.settingsService.catalog;
  readonly providerId = signal('MOCK');
  readonly provider = computed(() => this.catalog().find((p) => p.id === this.providerId()) ?? null);
  readonly requiereClave = computed(() => this.provider()?.requiereApiKey ?? false);
  readonly modelos = computed(() => this.provider()?.modelos ?? []);
  readonly sugerencia = signal<string | null>(null);

  readonly form = new FormGroup({
    provider: new FormControl('MOCK', { nonNullable: true, validators: [Validators.required] }),
    model: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    apiKey: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(512)] }),
  });

  ngOnInit(): void {
    forkJoin({
      catalog: this.settingsService.loadCatalog(),
      settings: this.settingsService.load(),
    }).subscribe(({ catalog, settings }) => {
      const ids = catalog.map((p) => p.id);
      const id = settings?.provider && ids.includes(settings.provider) ? settings.provider : 'MOCK';
      this.form.reset(
        { provider: id, model: settings?.model ?? '', apiKey: '' },
        { emitEvent: false },
      );
      this.providerId.set(id);
      this.actualizarValidadoresClave();
    });
  }

  cambioProvider(id: string): void {
    this.providerId.set(id);
    const proveedor = this.catalog().find((p) => p.id === id);
    this.form.controls.model.setValue(proveedor?.modeloPorDefecto ?? '', { emitEvent: false });
    this.form.controls.apiKey.setValue('', { emitEvent: false });
    this.sugerencia.set(null);
    this.actualizarValidadoresClave();
  }

  alEscribirClave(): void {
    const sugerido = sugerirProviderPorClave(this.form.controls.apiKey.value, this.catalog());
    this.sugerencia.set(sugerido && sugerido !== this.providerId() ? sugerido : null);
  }

  aplicarSugerencia(): void {
    const id = this.sugerencia();
    if (!id) {
      return;
    }
    const clave = this.form.controls.apiKey.value;
    this.form.controls.provider.setValue(id, { emitEvent: false });
    this.cambioProvider(id);
    this.form.controls.apiKey.setValue(clave);
  }

  nombreProveedor(id: string): string {
    return this.catalog().find((p) => p.id === id)?.nombre ?? id;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { provider, model, apiKey } = this.form.getRawValue();
    this.settingsService
      .save({
        provider,
        model: model || undefined,
        apiKey: this.requiereClave() ? apiKey : undefined,
      })
      .subscribe(() => this.form.controls.apiKey.reset(''));
  }

  remove(): void {
    if (!window.confirm('¿Eliminar la configuración de IA?')) {
      return;
    }
    this.settingsService.remove().subscribe((ok) => {
      if (!ok) {
        return;
      }
      this.form.reset({ provider: 'MOCK', model: '', apiKey: '' }, { emitEvent: false });
      this.providerId.set('MOCK');
      this.sugerencia.set(null);
      this.actualizarValidadoresClave();
    });
  }

  private actualizarValidadoresClave(): void {
    const validadores = this.requiereClave()
      ? [Validators.required, Validators.maxLength(512)]
      : [Validators.maxLength(512)];
    this.form.controls.apiKey.setValidators(validadores);
    this.form.controls.apiKey.updateValueAndValidity({ emitEvent: false });
  }
}
