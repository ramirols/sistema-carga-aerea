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

    readonly datosEncomiendas = computed(() => ({
        labels: [
            'En almacén',
            'Embarcada',
            'Entregada',
            'Cancelada',
        ],
        datasets: [{
            data: [
                this.contarEncomiendas('EN_ALMACEN'),
                this.contarEncomiendas('EMBARCADA'),
                this.contarEncomiendas('ENTREGADA'),
                this.contarEncomiendas('CANCELADA'),
            ],
            backgroundColor: [
                '#f59e0b',
                '#8b5cf6',
                '#22c55e',
                '#ef4444',
            ],
            borderWidth: 0,
            hoverOffset: 6,
        }],
    }));

    readonly opcionesEncomiendas = {
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
                    color: '#334155',
                },
            },
            tooltip: {
                backgroundColor: '#0f172a',
                padding: 10,
                cornerRadius: 8,
                boxPadding: 4,
            },
        },
    };

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

    readonly opcionesVuelos = {
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
                ticks: { color: '#64748b' },
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#64748b',
                    precision: 0,
                },
                grid: { color: '#f1f5f9' },
            },
        },
    };
}