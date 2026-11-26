import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProblemDetail } from './models';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 4000 });
  }

  info(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 4000 });
  }

  error(error: unknown): void {
    this.snackBar.open(this.describe(error), 'Cerrar', { duration: 7000 });
  }

  private describe(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }
    if (!(error instanceof HttpErrorResponse)) {
      return error instanceof Error ? error.message : 'Ocurrió un error inesperado';
    }

    const problem = error.error as ProblemDetail | null;
    const fieldErrors = problem?.errors ? Object.values(problem.errors).join(' · ') : '';
    return fieldErrors || problem?.detail || problem?.title || `Error ${error.status}`;
  }
}
