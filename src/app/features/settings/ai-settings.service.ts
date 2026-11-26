import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AiSettingsRequest, AiSettingsResponse } from '../../core/models';
import { NotificationsService } from '../../core/notifications.service';

@Injectable({ providedIn: 'root' })
export class AiSettingsService {
  private readonly http = inject(HttpClient);
  private readonly notifications = inject(NotificationsService);
  private readonly url = `${environment.apiUrl}/api/me/ai-settings`;

  readonly settings = signal<AiSettingsResponse | null>(null);
  readonly loading = signal(false);

  load(): Observable<AiSettingsResponse | null> {
    this.loading.set(true);
    return this.http.get<AiSettingsResponse>(this.url).pipe(
      tap((settings) => this.settings.set(settings)),
      catchError((error) => {
        this.notifications.error(error);
        return of(null);
      }),
      tap(() => this.loading.set(false)),
    );
  }

  save(request: AiSettingsRequest): Observable<AiSettingsResponse | null> {
    return this.http.put<AiSettingsResponse>(this.url, request).pipe(
      tap((settings) => {
        this.settings.set(settings);
        this.notifications.success('Configuración de IA guardada');
      }),
      catchError((error) => {
        this.notifications.error(error);
        return of(null);
      }),
    );
  }

  remove(): Observable<boolean> {
    return this.http.delete<void>(this.url).pipe(
      tap(() => {
        this.settings.set(null);
        this.notifications.success('Configuración eliminada');
      }),
      map(() => true),
      catchError((error) => {
        this.notifications.error(error);
        return of(false);
      }),
    );
  }
}
