import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { AiProvider } from '../../core/models';
import { NotificationsService } from '../../core/notifications.service';
import { AiSettingsPage } from './ai-settings-page';
import { AiSettingsService, sugerirProviderPorClave } from './ai-settings.service';

const catalogo: AiProvider[] = [
  {
    id: 'MOCK',
    nombre: 'Demo (Mock)',
    descripcion: 'Respuestas fijas, sin red y sin clave.',
    requiereApiKey: false,
    modelos: [],
    modeloPorDefecto: null,
    prefijosKey: [],
  },
  {
    id: 'OPENAI',
    nombre: 'OpenAI',
    descripcion: 'API de OpenAI.',
    requiereApiKey: true,
    modelos: ['gpt-6-luna', 'gpt-6.2-sol'],
    modeloPorDefecto: 'gpt-6-luna',
    prefijosKey: ['sk-proj-', 'sk-'],
  },
  {
    id: 'ANTHROPIC',
    nombre: 'Anthropic',
    descripcion: 'API de Claude.',
    requiereApiKey: true,
    modelos: ['claude-haiku-5-5'],
    modeloPorDefecto: 'claude-haiku-5-5',
    prefijosKey: ['sk-ant-'],
  },
  {
    id: 'GEMINI',
    nombre: 'Google Gemini',
    descripcion: 'API de Gemini.',
    requiereApiKey: true,
    modelos: ['gemini-4-hydrogen'],
    modeloPorDefecto: 'gemini-4-hydrogen',
    prefijosKey: ['AIza'],
  },
];

const notificaciones = { success: () => {}, info: () => {}, error: () => {} };

describe('AiSettingsService', () => {
  let service: AiSettingsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NotificationsService, useValue: notificaciones },
      ],
    });
    service = TestBed.inject(AiSettingsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('carga el catálogo de proveedores', () => {
    service.loadCatalog().subscribe();

    const req = http.expectOne(`${environment.apiUrl}/api/ai/providers`);
    expect(req.request.method).toBe('GET');
    req.flush({ providers: catalogo });

    expect(service.catalog().length).toBe(4);
  });
});

describe('sugerirProviderPorClave', () => {
  it('elige el prefijo más específico', () => {
    expect(sugerirProviderPorClave('sk-ant-api03-1234', catalogo)).toBe('ANTHROPIC');
    expect(sugerirProviderPorClave('sk-proj-1234', catalogo)).toBe('OPENAI');
    expect(sugerirProviderPorClave('sk-1234', catalogo)).toBe('OPENAI');
    expect(sugerirProviderPorClave('AIzaSy1234', catalogo)).toBe('GEMINI');
    expect(sugerirProviderPorClave('clave-rara', catalogo)).toBeNull();
    expect(sugerirProviderPorClave('', catalogo)).toBeNull();
  });
});

describe('AiSettingsPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<AiSettingsPage>>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiSettingsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: NotificationsService, useValue: notificaciones },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiSettingsPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/api/ai/providers`).flush({ providers: catalogo });
    http.expectOne(`${environment.apiUrl}/api/me/ai-settings`).flush({
      provider: null,
      model: null,
      keyHint: null,
      updatedAt: null,
    });
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('con MOCK no muestra el campo clave', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.requiereClave()).toBeFalsy();
    expect(compiled.querySelector('input[formcontrolname="apiKey"]')).toBeNull();
    expect(compiled.textContent).toContain('no necesita clave');
  });

  it('al elegir OpenAI muestra la clave y precarga su modelo', () => {
    const component = fixture.componentInstance;
    component.form.controls.provider.setValue('OPENAI');
    component.cambioProvider('OPENAI');
    fixture.detectChanges();

    expect(component.form.controls.model.value).toBe('gpt-6-luna');
    expect((fixture.nativeElement as HTMLElement).querySelector('input[formcontrolname="apiKey"]'))
      .not.toBeNull();
  });

  it('guardar con MOCK no envía apiKey', () => {
    fixture.componentInstance.save();

    const req = http.expectOne(`${environment.apiUrl}/api/me/ai-settings`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.provider).toBe('MOCK');
    expect(req.request.body.apiKey).toBeUndefined();
    req.flush({ provider: 'MOCK', model: null, keyHint: null, updatedAt: '2026-11-26T12:00:00Z' });
  });

  it('sugiere otro proveedor por el prefijo y espera confirmación', () => {
    const component = fixture.componentInstance;
    component.form.controls.provider.setValue('OPENAI');
    component.cambioProvider('OPENAI');
    component.form.controls.apiKey.setValue('sk-ant-api03-1234');
    component.alEscribirClave();

    expect(component.sugerencia()).toBe('ANTHROPIC');
    expect(component.form.controls.provider.value).toBe('OPENAI');

    component.aplicarSugerencia();

    expect(component.form.controls.provider.value).toBe('ANTHROPIC');
    expect(component.form.controls.apiKey.value).toBe('sk-ant-api03-1234');
    expect(component.sugerencia()).toBeNull();
  });
});
