import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { NotificationsService } from '../../core/notifications.service';
import { TicketImportPreview } from '../../core/models';
import { environment } from '../../../environments/environment';
import { TicketService } from './ticket.service';

describe('TicketService.importPdf', () => {
  let service: TicketService;
  let http: HttpTestingController;
  let notificado: boolean;

  const preview: TicketImportPreview = {
    titulo: 'Factura urgente del cliente',
    descripcion: 'No puedo iniciar sesion en mi cuenta',
    priority: 'HIGH',
    category: 'BILLING',
    nombreArchivo: 'reporte.pdf',
    paginas: 1,
    caracteres: 38,
    recortado: false,
  };

  beforeEach(() => {
    notificado = false;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: NotificationsService,
          useValue: {
            success: () => {},
            info: () => {},
            error: () => {
              notificado = true;
            },
          },
        },
      ],
    });
    service = TestBed.inject(TicketService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía el PDF como FormData y devuelve el preview', () => {
    const archivo = new File(['%PDF-'], 'reporte.pdf', { type: 'application/pdf' });
    let resultado: TicketImportPreview | null = null;

    service.importPdf(archivo).subscribe((datos) => (resultado = datos));

    const req = http.expectOne(`${environment.apiUrl}/api/tickets/import`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    expect((req.request.body as FormData).get('file')).not.toBeNull();
    req.flush(preview);

    expect(resultado).toEqual(preview);
  });

  it('notifica el error y devuelve null', () => {
    const archivo = new File(['%PDF-'], 'mal.pdf', { type: 'application/pdf' });
    let resultado: TicketImportPreview | null = preview;

    service.importPdf(archivo).subscribe((datos) => (resultado = datos));

    const req = http.expectOne(`${environment.apiUrl}/api/tickets/import`);
    req.flush('El archivo no es un PDF válido', { status: 400, statusText: 'Bad Request' });

    expect(resultado).toBeNull();
    expect(notificado).toBe(true);
  });
});
