import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const messageService = inject(MessageService);

    return next(request).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                authService.cerrarSesion();
                void router.navigate(['/login']);
            } else if (
                error.status !== 0 &&
                !request.url.includes('/auth/login')
            ) {
                messageService.add({
                    severity: 'error',
                    summary: 'No se pudo completar la acción',
                    detail:
                        error.error?.mensaje ??
                        'Ocurrió un error inesperado.'
                });
            }

            return throwError(() => error);
        })
    );
};
