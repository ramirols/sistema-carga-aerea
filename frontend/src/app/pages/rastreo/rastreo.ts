import {
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  DatePipe,
  DecimalPipe,
} from '@angular/common';

import { FormsModule } from '@angular/forms';

import {
  Router,
  RouterLink,
} from '@angular/router';

import { DialogModule } from 'primeng/dialog';

import { SeguimientoPublico } from '@core/models/seguimiento.model';
import { SeguimientoService } from '@core/services/seguimiento.service';

interface MensajeChat {
  autor: 'bot' | 'usuario';
  texto: string;
  resultado?: SeguimientoPublico;
  opciones?: string[];
}

const CODIGO_VALIDO = /^[A-Za-z0-9-]{3,20}$/;

const OPCIONES_SEGUIMIENTO = [
  'Buscar otro código',
  'No gracias, ya terminé',
];

const OPCIONES_UTILIDAD = [
  'Sí, me sirvió',
  'No, necesito ayuda',
];

@Component({
  selector: 'app-rastreo',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    RouterLink,
    DialogModule,
  ],
  templateUrl: './rastreo.html',
})
export class Rastreo {
  private readonly service = inject(SeguimientoService);
  private readonly router = inject(Router);

  readonly mensajes = signal<MensajeChat[]>([
    {
      autor: 'bot',
      texto:
        'Hola, soy Valeria, el asistente virtual del Sistema de Carga Aérea. ' +
        'Escribe el código de tu encomienda para consultar su estado.',
    },
  ]);

  readonly texto = signal('');
  readonly buscando = signal(false);
  readonly infoRecojoVisible = signal(false);
  readonly codigoActual = signal<string | null>(null);

  abrirInfoRecojo(): void {
    this.infoRecojoVisible.set(true);
  }

  cerrarInfoRecojo(): void {
    this.infoRecojoVisible.set(false);
  }

  irAConsignatario(): void {
    const codigo = this.codigoActual();

    void this.router.navigate(['/consignatario'], {
      queryParams: codigo ? { codigo } : {},
    });
  }

  enviar(): void {
    const mensaje = this.texto().trim();

    if (!mensaje || this.buscando()) {
      return;
    }

    this.agregarMensaje({
      autor: 'usuario',
      texto: mensaje,
    });

    this.texto.set('');

    if (!CODIGO_VALIDO.test(mensaje)) {
      const pareceUnaSolaPalabra =
        !mensaje.includes(' ') && mensaje.length < 6;

      this.responderBot(
        pareceUnaSolaPalabra
          ? 'Parece que estás ingresando una palabra clave. Escribe el código completo de tu encomienda.'
          : `No pude reconocer "${mensaje}" como un código válido. Verifica que sea correcto.`
      );

      return;
    }

    this.buscando.set(true);

    this.service.rastrear(mensaje).subscribe({
      next: (resultado) => {
        this.buscando.set(false);
        this.codigoActual.set(resultado.codigo);

        this.agregarMensaje({
          autor: 'bot',
          texto: '',
          resultado,
        });

        this.responderBot(
          '¿Esta información te fue útil?',
          OPCIONES_UTILIDAD
        );
      },
      error: () => {
        this.buscando.set(false);

        this.responderBot(
          `No encontramos ninguna encomienda con el código "${mensaje}". Verifica que sea correcto.`
        );
      },
    });
  }

  elegirOpcion(opcion: string): void {
    this.agregarMensaje({
      autor: 'usuario',
      texto: opcion,
    });

    switch (opcion) {
      case 'Sí, me sirvió':
        this.responderBot(
          '¡Qué bueno! ¿Deseas consultar otro código?',
          OPCIONES_SEGUIMIENTO
        );
        return;

      case 'No, necesito ayuda':
        this.responderBot(
          'Verifica que el código esté escrito tal como te lo entregaron. ¿Deseas intentar con otro código?',
          OPCIONES_SEGUIMIENTO
        );
        return;

      case 'No gracias, ya terminé':
        this.responderBot(
          '¡Gracias por usar el asistente de Carga Aérea! Que tengas un buen día.',
          []
        );
        return;

      default:
        this.responderBot(
          'Perfecto, escribe el código que quieras consultar.',
          []
        );
    }
  }

  nombreEstado(estado: string): string {
    const nombres: Record<string, string> = {
      EN_ALMACEN: 'En almacén',
      EMBARCADA: 'Embarcada',
      ENTREGADA: 'Entregada',
      CANCELADA: 'Cancelada',
      ABANDONADA: 'Abandonada',
    };

    return nombres[estado] ?? estado;
  }

  claseEstado(estado: string): string {
    const clases: Record<string, string> = {
      EN_ALMACEN:
        'bg-amber-500/10 text-amber-700 dark:text-amber-400',
      EMBARCADA:
        'bg-blue-500/10 text-blue-700 dark:text-blue-400',
      ENTREGADA:
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      CANCELADA:
        'bg-red-500/10 text-red-700 dark:text-red-400',
      ABANDONADA:
        'bg-slate-500/10 text-slate-700 dark:text-slate-300',
    };

    return (
      clases[estado] ??
      'bg-slate-500/10 text-slate-700 dark:text-slate-300'
    );
  }

  mensajeAutorizacion(resultado: SeguimientoPublico): string {
    const nombre = resultado.personaAutorizadaNombre;

    switch (resultado.estadoAutorizacion) {
      case 'APROBADA':
        return `Autorización aprobada: ${nombre} puede recoger esta encomienda.`;
      case 'RECHAZADA':
        return `La autorización para que ${nombre} recoja esta encomienda fue rechazada. Contacta con la aerolínea.`;
      case 'PENDIENTE':
        return `Solicitud de cambio de consignatario en revisión: ${nombre} está esperando aprobación.`;
      default:
        return `${nombre} está autorizado para recoger esta encomienda.`;
    }
  }

  claseAutorizacion(resultado: SeguimientoPublico): string {
    switch (resultado.estadoAutorizacion) {
      case 'APROBADA':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
      case 'RECHAZADA':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
    }
  }

  iconoAutorizacion(resultado: SeguimientoPublico): string {
    switch (resultado.estadoAutorizacion) {
      case 'APROBADA':
        return 'pi-check-circle';
      case 'RECHAZADA':
        return 'pi-times-circle';
      case 'PENDIENTE':
        return 'pi-clock';
      default:
        return 'pi-info-circle';
    }
  }

  private responderBot(
    texto: string,
    opciones: string[] = OPCIONES_SEGUIMIENTO
  ): void {
    this.agregarMensaje({
      autor: 'bot',
      texto,
      opciones,
    });
  }

  private agregarMensaje(mensaje: MensajeChat): void {
    this.mensajes.update((lista) => [
      ...lista,
      mensaje,
    ]);
  }
}