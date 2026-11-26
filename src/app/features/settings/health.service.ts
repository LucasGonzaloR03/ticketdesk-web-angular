import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, EMPTY, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly http = inject(HttpClient);

  readonly status = signal<'checking' | 'up' | 'down'>('checking');

  check(): void {
    this.http.get<{ status: string }>(`${environment.apiUrl}/health`).pipe(
      tap((health) => this.status.set(health.status === 'UP' ? 'up' : 'down')),
      catchError(() => {
        this.status.set('down');
        return EMPTY;
      }),
    ).subscribe();
  }
}
