import { OverlayContainer } from '@angular/cdk/overlay';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatMenuTrigger } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { environment } from '../../environments/environment';
import { AuthResponse, Role } from '../core/models';
import { NotificationsService } from '../core/notifications.service';
import { SessionService } from '../core/session.service';
import { Shell } from './shell';

const notificaciones = { success: () => {}, info: () => {}, error: () => {} };

const usuario = (role: Role): AuthResponse => ({
  token: 'token-demo',
  tokenType: 'Bearer',
  userId: 1,
  email: `${role.toLowerCase()}@ticketdesk.dev`,
  role,
  name: 'Usuario demo',
});

describe('Shell', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<Shell>>;
  let session: SessionService;
  let http: HttpTestingController;
  let overlay: OverlayContainer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NotificationsService, useValue: notificaciones },
      ],
    }).compileComponents();

    session = TestBed.inject(SessionService);
    session.clear();
    session.save(usuario('AGENT'));
    http = TestBed.inject(HttpTestingController);
    overlay = TestBed.inject(OverlayContainer);

    fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/health`).flush({ status: 'UP' });
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    session.clear();
    overlay.ngOnDestroy();
  });

  const abrirMenuMovil = async (): Promise<{ destinos: string[]; texto: string }> => {
    const trigger = fixture.debugElement.queryAll(By.directive(MatMenuTrigger))[0]
      .injector.get(MatMenuTrigger);
    trigger.openMenu();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const panel = overlay.getContainerElement();
    const destinos = Array.from(panel.querySelectorAll('a[mat-menu-item]')).map(
      (link) => link.getAttribute('routerlink') ?? '',
    );
    const texto = panel.textContent ?? '';

    trigger.closeMenu();
    fixture.detectChanges();

    return { destinos, texto };
  };

  it('el menú móvil ofrece todos los destinos de la navegación', async () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('button.menu-button')).not.toBeNull();
    expect((await abrirMenuMovil()).destinos).toEqual([
      '/tickets',
      '/tickets/new',
      '/tickets/import',
      '/agent',
      '/settings/ai',
    ]);
  });

  it('el menú móvil incluye cerrar sesión', async () => {
    expect((await abrirMenuMovil()).texto).toContain('Cerrar sesión');
  });

  it('el menú móvil oculta Panel agente para un CLIENT', async () => {
    session.clear();
    session.save(usuario('CLIENT'));
    fixture.detectChanges();

    const menu = await abrirMenuMovil();

    expect(menu.destinos).not.toContain('/agent');
    expect(menu.texto).not.toContain('Panel agente');
  });
});
