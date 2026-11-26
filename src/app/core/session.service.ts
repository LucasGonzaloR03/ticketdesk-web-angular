import { computed, Injectable, signal } from '@angular/core';

import { AuthResponse } from './models';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly storageKey = 'ticketdesk.session';

  readonly currentUser = signal<AuthResponse | null>(this.read());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly role = computed(() => this.currentUser()?.role ?? null);
  readonly token = computed(() => this.currentUser()?.token ?? null);
  readonly userId = computed(() => this.currentUser()?.userId ?? null);
  readonly isAgent = computed(() => this.role() === 'AGENT' || this.role() === 'ADMIN');

  save(response: AuthResponse): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.storageKey, JSON.stringify(response));
    }
    this.currentUser.set(response);
  }

  clear(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.storageKey);
    }
    this.currentUser.set(null);
  }

  private read(): AuthResponse | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Partial<AuthResponse>;
      if (!parsed.token || !parsed.role || !parsed.userId) {
        return null;
      }
      return parsed as AuthResponse;
    } catch {
      return null;
    }
  }
}
