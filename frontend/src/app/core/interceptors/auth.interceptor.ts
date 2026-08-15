import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
    const authService = inject(AuthService);
    const token = authService.obtenerToken();

    if (!token || request.url.includes('/api/auth/login')) {
        return next(request);
    }

    const requestAutorizada = request.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });

    return next(requestAutorizada);
};