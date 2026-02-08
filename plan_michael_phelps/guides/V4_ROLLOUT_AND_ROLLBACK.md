# V4 Rollout And Rollback

Fecha: 2026-02-08

## Activacion

1. Activacion puntual por URL:
- Abre `app/web/?v4=true`.

2. Activacion global por configuracion:
- En `config/settings.json`, cambia `content_version` a `v4`.

## Smoke Test Minimo (antes de abrir a usuarios)

1. Ingreso:
- Carga la app y confirma que aparece shell V4 (header "Sesion de ejecucion V4").

2. Ejecucion de paso:
- Inicia timer en un paso con `timer_complete`.
- Completa evidencia requerida.
- Valida y avanza al siguiente paso.

3. Reanudacion:
- Recarga pagina en mitad de sesion.
- Verifica que se mantiene paso activo y estado local.

4. Responsivo:
- Revisar en viewport mobile que el footer sticky permita ejecutar CTA principal.

5. Eventos:
- Confirmar eventos en consola (`[V4 telemetry]`) para inicio/pasos/gates/cierre.

## Rollback Seguro

1. Inmediato por URL:
- Quitar `?v4=true` y recargar.

2. Global por config:
- Cambiar `content_version` a `v3` en `config/settings.json`.
- Recargar aplicacion.

3. Criterio de rollback:
- Bloqueo de paso sin recovery operativo.
- Error de carga de contenido V4 que impida iniciar sesion.
- Regresion critica en mobile (CTA no accesible).

## Notas Operativas

1. El modo V4 es no destructivo para V3; usa feature toggle en runtime.
2. El validador `bin/validate_content_v4` debe correrse antes de cada release de contenido.
3. Si falla contenido V4, corregir JSON antes de ampliar rollout.
