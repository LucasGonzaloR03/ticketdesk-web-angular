import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AiProvider,
  AiProviderCatalogResponse,
  AiSettingsRequest,
  AiSettingsResponse,
} from '../../core/models';
import { NotificationsService } from '../../core/notifications.service';

/**
 * Sugiere un proveedor por el prefijo de la clave, como hace el backend.
 * El prefijo más específico gana (sk-ant- antes que sk-). Es sólo una
 * sugerencia: la interfaz siempre pide confirmación.
 */
export function sugerirProviderPorClave(
  apiKey: string,
  providers: AiProvider[],
): string | null {
  const clave = apiKey?.trim();
  if (!clave) {
    return null;
  }
  return providers
    .flatMap((provider) =>
      provider.prefijosKey.map((prefijo) => ({ prefijo, id: provider.id })),
    )
    .sort((a, b) => b.prefijo.length - a.prefijo.length)
    .find((candidato) => clave.startsWith(candidato.prefijo))?.id ?? null;
}

@Injectable({ providedIn: 'root' })
export class AiSettingsService {
  private readonly http = inject(HttpClient);
  private readonly notifications = inject(NotificationsService);
  private readonly url = `${environment.apiUrl}/api/me/ai-settings`;

  readonly settings = signal<AiSettingsResponse | null>(null);
  readonly catalog = signal<AiProvider[]>([]);
  readonly loading = signal(false);

  loadCatalog(): Observable<AiProvider[]> {
    return this.http
      .get<AiProviderCatalogResponse>(`${environment.apiUrl}/api/ai/providers`)
      .pipe(
        map((respuesta) => respuesta.providers),
        tap((providers) => this.catalog.set(providers)),
        catchError((error) => {
          this.notifications.error(error);
          return of([]);
        }),
      );
  }

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
