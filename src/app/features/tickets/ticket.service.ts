import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, EMPTY, finalize, map, Observable, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AssignRequest,
  CommentResponse,
  CreateCommentRequest,
  CreateTicketRequest,
  DuplicateResponse,
  TicketEventResponse,
  TicketFilters,
  TicketImportPreview,
  TicketResponse,
  UpdateTicketRequest,
} from '../../core/models';
import { NotificationsService } from '../../core/notifications.service';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly notifications = inject(NotificationsService);
  private readonly base = `${environment.apiUrl}/api/tickets`;

  readonly tickets = signal<TicketResponse[]>([]);
  readonly ticket = signal<TicketResponse | null>(null);
  readonly comments = signal<CommentResponse[]>([]);
  readonly events = signal<TicketEventResponse[]>([]);
  readonly duplicates = signal<DuplicateResponse[]>([]);
  readonly loading = signal(false);

  list(filters: TicketFilters = {}): Observable<TicketResponse[]> {
    this.loading.set(true);
    let params = new HttpParams();
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.priority) {
      params = params.set('priority', filters.priority);
    }
    if (filters.category) {
      params = params.set('category', filters.category);
    }

    return this.http.get<TicketResponse[]>(this.base, { params }).pipe(
      tap((tickets) => this.tickets.set(tickets)),
      catchError((error) => {
        this.notifications.error(error);
        return EMPTY;
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  create(request: CreateTicketRequest): Observable<TicketResponse | null> {
    return this.http.post<TicketResponse>(this.base, request).pipe(
      tap((created) => {
        this.tickets.update((items) => [created, ...items]);
        this.notifications.success('Ticket creado correctamente');
      }),
      catchError((error) => {
        this.notifications.error(error);
        return of(null);
      }),
    );
  }

  importPdf(file: File): Observable<TicketImportPreview | null> {
    const datos = new FormData();
    datos.append('file', file, file.name);
    return this.http.post<TicketImportPreview>(`${this.base}/import`, datos).pipe(
      catchError((error) => {
        this.notifications.error(error);
        return of(null);
      }),
    );
  }

  detail(id: number): Observable<TicketResponse | null> {
    return this.http.get<TicketResponse>(`${this.base}/${id}`).pipe(
      tap((ticket) => this.ticket.set(ticket)),
      catchError((error) => {
        this.notifications.error(error);
        return of(null);
      }),
    );
  }

  patch(id: number, request: UpdateTicketRequest): Observable<TicketResponse | null> {
    return this.http.patch<TicketResponse>(`${this.base}/${id}`, request).pipe(
      tap((updated) => {
        this.ticket.set(updated);
        this.tickets.update((items) => items.map((item) => (item.id === id ? updated : item)));
        this.notifications.success('Ticket actualizado');
      }),
      catchError((error) => {
        this.notifications.error(error);
        return of(null);
      }),
    );
  }

  assign(id: number, request: AssignRequest): Observable<TicketResponse | null> {
    return this.http.put<TicketResponse>(`${this.base}/${id}/assignee`, request).pipe(
      tap((updated) => {
        this.ticket.set(updated);
        this.tickets.update((items) => items.map((item) => (item.id === id ? updated : item)));
        this.notifications.success('Ticket asignado');
      }),
      catchError((error) => {
        this.notifications.error(error);
        return of(null);
      }),
    );
  }

  remove(id: number): Observable<boolean> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => {
        this.tickets.update((items) => items.filter((item) => item.id !== id));
        if (this.ticket()?.id === id) {
          this.ticket.set(null);
        }
        this.notifications.success('Ticket eliminado');
      }),
      map(() => true),
      catchError((error) => {
        this.notifications.error(error);
        return of(false);
      }),
    );
  }

  loadComments(id: number): Observable<CommentResponse[]> {
    return this.http.get<CommentResponse[]>(`${this.base}/${id}/comments`).pipe(
      tap((comments) => this.comments.set(comments)),
      catchError((error) => {
        this.notifications.error(error);
        return EMPTY;
      }),
    );
  }

  addComment(id: number, request: CreateCommentRequest): Observable<CommentResponse | null> {
    return this.http.post<CommentResponse>(`${this.base}/${id}/comments`, request).pipe(
      tap((comment) => {
        this.comments.update((items) => [...items, comment]);
        this.notifications.success('Comentario agregado');
      }),
      catchError((error) => {
        this.notifications.error(error);
        return of(null);
      }),
    );
  }

  loadEvents(id: number): Observable<TicketEventResponse[]> {
    return this.http.get<TicketEventResponse[]>(`${this.base}/${id}/events`).pipe(
      tap((events) => this.events.set(events)),
      catchError((error) => {
        this.notifications.error(error);
        return EMPTY;
      }),
    );
  }

  loadDuplicates(id: number): Observable<DuplicateResponse[]> {
    return this.http.get<DuplicateResponse[]>(`${this.base}/${id}/duplicates`).pipe(
      tap((duplicates) => this.duplicates.set(duplicates)),
      catchError((error) => {
        this.notifications.error(error);
        return EMPTY;
      }),
    );
  }
}
