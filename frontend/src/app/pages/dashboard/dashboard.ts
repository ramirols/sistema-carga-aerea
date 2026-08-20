import {
    Component,
    computed,
    inject,
    OnInit,
    signal,
} from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';

import { Encomienda } from '@core/models/encomienda.model';
import { Vuelo } from '@core/models/vuelo.model';

import { EncomiendaService } from '@core/services/encomienda.service';
import { ThemeService } from '@core/services/theme.service';
import { VueloService } from '@core/services/vuelo.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        DecimalPipe,
        ChartModule,
        ProgressBarModule,
        SkeletonModule,
    ],
    templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
    private readonly vueloService =
        inject(VueloService);

    private readonly encomiendaService =
        inject(EncomiendaService);

    readonly themeService = inject(ThemeService);

    readonly vuelos = signal<Vuelo[]>([]);
    readonly encomiendas =
        signal<Encomienda[]>([]);

    readonly cargando = signal(true);

    ngOnInit(): void {
        let completadas = 0;

        const terminar = () => {
            completadas++;

            if (completadas === 2) {
                this.cargando.set(false);
            }
        };

        this.vueloService.listar(0, 100).subscribe({
            next: (pagina) => {
                this.vuelos.set(pagina.content);
                terminar();
            },
            error: terminar,
        });

        this.encomiendaService
            .listar(0, 100)
            .subscribe({
                next: (pagina) => {
                    this.encomiendas.set(
                        pagina.content,
                    );
                    terminar();
                },
                error: terminar,
            });
    }

    contarVuelos(estado: string): number {
        return this.vuelos().filter(
            (vuelo) => vuelo.estado === estado,
        ).length;
    }

    contarEncomiendas(estado: string): number {
        return this.encomiendas().filter(
            (encomienda) =>
                encomienda.estado === estado,
        ).length;
    }

    porcentaje(vuelo: Vuelo): number {
        if (vuelo.capacidadMaximaKg <= 0) {
            return 0;
        }

        return Math.min(
            100,
            (vuelo.pesoOcupadoKg /
                vuelo.capacidadMaximaKg) *
            100,
        );
    }

    readonly totalEncomiendas = computed(() =>
        this.encomiendas().length,
    );

    readonly totalVuelos = computed(() =>
        this.vuelos().length,
    );

    readonly ultimosVuelosProgramados = computed(() =>
        this.vuelos()
            .filter((vuelo) => vuelo.estado === 'PROGRAMADO')
            .slice()
            .sort((a, b) =>
                b.fechaCreacion.localeCompare(a.fechaCreacion),
            )
            .slice(0, 5),
    );

    readonly datosEncomiendas = computed(() => ({
        labels: [
            'En almacén',
            'Embarcada',
            'Arribada',
            'Entregada',
            'Cancelada',
            'Abandonada',
        ],
        datasets: [{
            data: [
                this.contarEncomiendas('EN_ALMACEN'),
                this.contarEncomiendas('EMBARCADA'),
                this.contarEncomiendas('ARRIBADA'),
                this.contarEncomiendas('ENTREGADA'),
                this.contarEncomiendas('CANCELADA'),
                this.contarEncomiendas('ABANDONADA'),
            ],
            backgroundColor: [
                '#f59e0b',
                '#8b5cf6',
                '#14b8a6',
                '#22c55e',
                '#ef4444',
                '#64748b',
            ],
            borderWidth: 0,
            hoverOffset: 6,
        }],
    }));

    readonly opcionesEncomiendas = computed(() => ({
        cutout: '68%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    padding: 16,
                    font: { size: 12 },
                    color: this.themeService.oscuro()
                        ? '#e2e8f0'
                        : '#334155',
                },
            },
            tooltip: {
                backgroundColor: '#0f172a',
                padding: 10,
                cornerRadius: 8,
                boxPadding: 4,
            },
        },
    }));

    readonly datosVuelos = computed(() => ({
        labels: [
            'Programado',
            'Despachado',
            'Cancelado',
        ],
        datasets: [{
            label: 'Vuelos',
            data: [
                this.contarVuelos('PROGRAMADO'),
                this.contarVuelos('DESPACHADO'),
                this.contarVuelos('CANCELADO'),
            ],
            backgroundColor: [
                '#3b82f6',
                '#22c55e',
                '#ef4444',
            ],
            borderRadius: 8,
            maxBarThickness: 46,
        }],
    }));

    readonly opcionesVuelos = computed(() => {
        const oscuro = this.themeService.oscuro();

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0f172a',
                    padding: 10,
                    cornerRadius: 8,
                    boxPadding: 4,
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: oscuro ? '#cbd5e1' : '#64748b',
                    },
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: oscuro ? '#cbd5e1' : '#64748b',
                        precision: 0,
                    },
                    grid: {
                        color: oscuro ? '#1e293b' : '#f1f5f9',
                    },
                },
            },
        };
    });
}