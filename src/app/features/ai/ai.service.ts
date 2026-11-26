import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ClassificationResponse, SummaryResponse, SuggestReplyResponse } from '../../core/models';
import { NotificationsService } from '../../core/notifications.service';

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly notifications = inject(NotificationsService);
  private readonly base = `${environment.apiUrl}/api/tickets`;

  readonly classification = signal<ClassificationResponse | null>(null);
  readonly summaryResult = signal<SummaryResponse | null>(null);
  readonly reply = signal<SuggestReplyResponse | null>(null);
  readonly busy = signal(false);

  classify(id: number): Observable<ClassificationResponse | null> {
    this.busy.set(true);
    return this.http.post<ClassificationResponse>(`${this.base}/${id}/ai/classify`, {}).pipe(
      tap((result) => {
        this.classification.set(result);
        this.notifications.success('Clasificación lista');
      }),
      catchError((error) => {
        this.notifications.error(error);
        return of(null);
      }),
      finalize(() => this.busy.set(false)),
    );
  }

  summarize(id: number): Observable<SummaryResponse | null> {
    this.busy.set(true);
    return this.http.post<SummaryResponse>(`${this.base}/${id}/ai/summary`, {}).pipe(
      tap((result) => {
        this.summaryResult.set(result);
        this.notifications.success('Resumen generado');
      }),
      catchError((error) => {
        this.notifications.error(error);
        return of(null);
      }),
      finalize(() => this.busy.set(false)),
    );
  }

  suggestReply(id: number): Observable<SuggestReplyResponse | null> {
    this.busy.set(true);
    return this.http.post<SuggestReplyResponse>(`${this.base}/${id}/ai/suggest-reply`, {}).pipe(
      tap((result) => {
        this.reply.set(result);
        this.notifications.success('Borrador generado');
      }),
      catchError((error) => {
        this.notifications.error(error);
        return of(null);
      }),
      finalize(() => this.busy.set(false)),
    );
  }
}
