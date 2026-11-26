import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NotificationsService } from '../../core/notifications.service';
import { TicketEmailPreview, TicketImportPreview } from '../../core/models';
import { environment } from '../../../environments/environment';
import { TicketImportPage } from './ticket-import';
import { TicketService } from './ticket.service';

const notificaciones = { success: () => {}, info: () => {}, error: () => {} };

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

describe('TicketService.importPdf', () => {
  let service: TicketService;
  let http: HttpTestingController;
  let notificado: boolean;

  const previewCorreo: TicketEmailPreview = {
    titulo: 'Factura urgente del cliente',
    descripcion: 'De: cliente@example.com\n\nNo puedo iniciar sesion',
    priority: 'HIGH',
    category: 'BILLING',
    remitente: 'cliente@example.com',
    fecha: '2025-11-26T10:00:00Z',
    nombreArchivo: 'factura.eml',
    caracteres: 24,
    adjuntos: 1,
    recortado: false,
    provider: 'GEMINI',
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

  it('envía el correo como FormData y devuelve el preview', () => {
    const archivo = new File(['From: cliente@example.com'], 'factura.eml', { type: 'message/rfc822' });
    let resultado: TicketEmailPreview | null = null;

    service.importEmail(archivo).subscribe((datos) => (resultado = datos));

    const req = http.expectOne(`${environment.apiUrl}/api/tickets/import-email`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    expect((req.request.body as FormData).get('file')).not.toBeNull();
    req.flush(previewCorreo);

    expect(resultado).toEqual(previewCorreo);
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

describe('TicketImportPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TicketImportPage>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketImportPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: NotificationsService, useValue: notificaciones },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TicketImportPage);
    fixture.detectChanges();
  });

  it('muestra el proveedor cuando la IA sugirió los campos', () => {
    fixture.componentInstance.preview.set({ ...preview, provider: 'OPENAI' });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Sugerido por OPENAI');
  });

  it('no muestra el badge con las heurísticas', () => {
    fixture.componentInstance.preview.set({ ...preview, provider: null });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).not.toContain('Sugerido por');
  });
});
