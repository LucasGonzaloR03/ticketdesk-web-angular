import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from './models';
import { NotificationsService } from './notifications.service';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private readonly notifications = inject(NotificationsService);

  readonly busy = signal(false);

  login(request: LoginRequest): Observable<boolean> {
    this.busy.set(true);
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/login`, request).pipe(
      tap((response) => {
        this.session.save(response);
        this.notifications.success(`¡Hola, ${response.name}!`);
      }),
      map(() => true),
      catchError((error) => {
        this.notifications.error(error);
        return of(false);
      }),
      finalize(() => this.busy.set(false)),
    );
  }

  register(request: RegisterRequest): Observable<boolean> {
    this.busy.set(true);
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/register`, request).pipe(
      tap((response) => {
        this.session.save(response);
        this.notifications.success('Cuenta creada. ¡Bienvenido!');
      }),
      map(() => true),
      catchError((error) => {
        this.notifications.error(error);
        return of(false);
      }),
      finalize(() => this.busy.set(false)),
    );
  }

  logout(): void {
    this.session.clear();
    this.notifications.info('Sesión cerrada');
  }
}
