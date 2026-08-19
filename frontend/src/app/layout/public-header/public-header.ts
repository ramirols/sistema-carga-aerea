import {
    Component,
    HostListener,
    inject,
    signal,
} from '@angular/core';

import {
    RouterLink,
} from '@angular/router';

import { ThemeService } from '@core/services/theme.service';

@Component({
    selector: 'app-public-header',
    standalone: true,
    imports: [
        RouterLink,
    ],
    templateUrl: './public-header.html',
})
export class PublicHeader {
    readonly themeService = inject(ThemeService);

    readonly menuAbierto = signal(false);
    readonly tieneScroll = signal(false);

    alternarMenu(): void {
        this.menuAbierto.update((estado) => !estado);
    }

    cerrarMenu(): void {
        this.menuAbierto.set(false);
    }

    alternarTema(): void {
        this.themeService.alternar();
    }

    @HostListener('window:scroll')
    detectarScroll(): void {
        this.tieneScroll.set(window.scrollY > 16);
    }

    @HostListener('document:keydown.escape')
    cerrarConEscape(): void {
        this.cerrarMenu();
    }
}