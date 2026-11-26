import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-auth-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <section class="auth-page">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>{{ isRegister ? 'Crear cuenta' : 'Ingresar' }}</mat-card-title>
          <mat-card-subtitle>
            {{ isRegister ? 'Los nuevos usuarios son CLIENT.' : 'TicketDesk AI · demo de portfolio' }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="stack">
            @if (isRegister) {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nombre</mat-label>
                <input matInput formControlName="name" autocomplete="name" />
                @if (form.controls.name.invalid && form.controls.name.touched) {
                  <mat-error>Ingresá tu nombre.</mat-error>
                }
              </mat-form-field>
            }

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              @if (form.controls.email.invalid && form.controls.email.touched) {
                <mat-error>Ingresá un email válido.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="current-password" />
              @if (form.controls.password.invalid && form.controls.password.touched) {
                <mat-error>Mínimo 8 caracteres.</mat-error>
              }
            </mat-form-field>

            <button mat-flat-button type="submit" [disabled]="auth.busy()">
              {{ isRegister ? 'Registrarme' : 'Entrar' }}
            </button>
          </form>

          @if (!isRegister) {
            <div class="demo-hint">
              <b>Usuarios demo</b>
              <span>cliente&#64;ticketdesk.dev / agente&#64;ticketdesk.dev / admin&#64;ticketdesk.dev</span>
              <span>Password: demo1234</span>
            </div>
          }
        </mat-card-content>

        <mat-card-actions>
          @if (isRegister) {
            <a mat-button routerLink="/login">Ya tengo cuenta</a>
          } @else {
            <a mat-button routerLink="/register">Crear cuenta nueva</a>
          }
        </mat-card-actions>
      </mat-card>
    </section>
  `,
  styles: `
    .auth-page {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: var(--mat-sys-surface-container-low);
    }

    .auth-card {
      width: min(420px, 100%);
      padding: 12px;
    }

    mat-card-content {
      padding-top: 16px;
    }

    .demo-hint {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 20px;
      padding: 12px;
      border-radius: 8px;
      background: var(--mat-sys-surface-container);
      font-size: 0.78rem;
      color: var(--mat-sys-on-surface-variant);
      word-break: break-word;
    }

    @media (max-width: 720px) {
      .auth-page {
        padding: 16px 12px;
      }

      .auth-card {
        padding: 8px;
      }
    }
  `,
})
export class AuthPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly isRegister = this.route.snapshot.data['mode'] === 'register';
  private readonly returnUrl = this.safeReturnUrl();

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: this.isRegister ? [Validators.required, Validators.maxLength(255)] : [],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.form.getRawValue();
    const request$ = this.isRegister
      ? this.auth.register({ name, email, password })
      : this.auth.login({ email, password });

    request$.subscribe((ok) => {
      if (ok) {
        this.router.navigateByUrl(this.returnUrl);
      }
    });
  }

  private safeReturnUrl(): string {
    const candidate = this.route.snapshot.queryParamMap.get('returnUrl');
    return candidate?.startsWith('/') && !candidate.startsWith('//') ? candidate : '/tickets';
  }
}
