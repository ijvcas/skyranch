# Configuración de iCloud Backup para SkyRanch

## Para Desarrolladores

### 1. Xcode Configuration

Después de ejecutar `npx cap open ios`, en Xcode:

1. Selecciona el proyecto "App" en el navegador
2. Ve a la pestaña "Signing & Capabilities"
3. Haz clic en "+ Capability"
4. Agrega "iCloud"
5. En la sección iCloud:
   - Marca "iCloud Documents"
   - En "Containers", agrega: `iCloud.com.skyranch.app`

### 2. Verificar Entitlements

El archivo `App.entitlements` debe existir con las configuraciones de iCloud. Si no existe, Xcode lo creará automáticamente al agregar la capability.

**Contenido esperado del archivo `ios/App/App/App.entitlements`:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- iCloud Key-Value Storage -->
    <key>com.apple.developer.ubiquity-kvstore-identifier</key>
    <string>$(TeamIdentifierPrefix)$(CFBundleIdentifier)</string>
    
    <!-- iCloud Documents -->
    <key>com.apple.developer.ubiquity-container-identifiers</key>
    <array>
        <string>iCloud.$(CFBundleIdentifier)</string>
    </array>
    
    <!-- Allow access to iCloud Drive -->
    <key>com.apple.developer.icloud-services</key>
    <array>
        <string>CloudDocuments</string>
    </array>
</dict>
</plist>
```

### 3. Actualizar Info.plist

El archivo `ios/App/App/Info.plist` debe incluir la configuración del contenedor de iCloud:

```xml
<key>NSUbiquitousContainers</key>
<dict>
    <key>iCloud.com.skyranch.app</key>
    <dict>
        <key>NSUbiquitousContainerIsDocumentScopePublic</key>
        <true/>
        <key>NSUbiquitousContainerName</key>
        <string>SkyRanch Backups</string>
        <key>NSUbiquitousContainerSupportedFolderLevels</key>
        <string>Any</string>
    </dict>
</dict>
```

### 4. Testing

1. Ejecuta la app en un **dispositivo real** (no simulador - el simulador no soporta iCloud completamente)
2. Asegúrate de estar conectado a iCloud en **Ajustes > [Tu nombre] > iCloud**
3. Habilita **iCloud Drive** en el dispositivo
4. Crea un backup desde la app usando el botón "Exportar Backup Integral"
5. Verifica que aparece en **Archivos > iCloud Drive > SkyRanch Backups**

### 5. Solución de Problemas

**Los backups no aparecen en iCloud Drive:**
- Verifica que iCloud Drive esté habilitado en Ajustes
- Verifica que hay suficiente espacio en iCloud
- Espera unos minutos - la sincronización puede tardar
- Verifica que los entitlements estén correctamente configurados en Xcode

**Error al leer archivos:**
- Asegúrate de que la capability de iCloud esté agregada en Xcode
- Verifica que el Bundle ID coincida con el configurado en el entitlement
- Limpia el proyecto en Xcode (Shift+Command+K) y vuelve a compilar

---

## Para Usuarios Finales

### Habilitar Sincronización con iCloud

1. Ve a **Ajustes** en tu iPhone/iPad
2. Toca tu nombre en la parte superior
3. Selecciona **iCloud**
4. Activa **iCloud Drive**
5. Desplázate hacia abajo y asegúrate de que **SkyRanch** esté activado

### Crear un Backup

1. Abre la app **SkyRanch**
2. Ve al menú principal (☰) y selecciona **Configuración**
3. Selecciona **Backup y Restauración**
4. Marca las categorías de datos que deseas respaldar
5. Toca **Exportar Backup Integral**
6. El backup se guardará automáticamente en iCloud Drive

✅ **Confirmación:** Verás un mensaje indicando que el backup se completó y se sincronizará con iCloud.

### Restaurar desde un Backup

#### Desde la App (iOS):

1. Abre **SkyRanch**
2. Ve a **Configuración > Backup y Restauración**
3. En la sección **Backups en iCloud Drive**, verás todos tus backups disponibles
4. Cada backup muestra:
   - Nombre del archivo
   - Fecha de creación
   - Tamaño del archivo
   - Número de registros
5. Toca **Restaurar** en el backup que desees
6. Marca las categorías que quieres restaurar
7. Toca **Restaurar Sistema**

#### Desde la App Archivos:

1. Abre la app **Archivos** en tu dispositivo
2. Ve a **iCloud Drive**
3. Busca la carpeta **SkyRanch Backups**
4. Aquí verás todos tus archivos de backup guardados

### Eliminar un Backup

1. En la sección **Backups en iCloud Drive** de la app
2. Toca el botón de **papelera (🗑️)** junto al backup que deseas eliminar
3. Confirma la eliminación
4. El archivo se eliminará permanentemente de iCloud Drive

⚠️ **Advertencia:** Esta acción no se puede deshacer.

### Ver Espacio Usado en iCloud

1. Ve a **Ajustes > [Tu nombre] > iCloud**
2. Toca **Administrar almacenamiento**
3. Busca **SkyRanch** en la lista de apps
4. Aquí verás cuánto espacio están usando tus backups

### Sincronización entre Dispositivos

Si usas SkyRanch en varios dispositivos iOS:

1. Asegúrate de que **iCloud Drive** esté habilitado en todos los dispositivos
2. Usa la **misma cuenta de iCloud** en todos los dispositivos
3. Los backups creados en un dispositivo aparecerán automáticamente en los demás
4. Puedes restaurar un backup creado en un dispositivo desde cualquier otro dispositivo

### Consejos Importantes

✅ **Mejores Prácticas:**
- Crea backups regularmente (semanal o mensualmente)
- Verifica que hay suficiente espacio en iCloud antes de crear backups grandes
- Los backups solo se sincronizan cuando tienes conexión **WiFi**
- Mantén al menos 2-3 backups recientes antes de eliminar los antiguos

⚠️ **Limitaciones:**
- La sincronización requiere conexión WiFi (no funciona solo con datos móviles)
- Necesitas suficiente espacio disponible en tu cuenta de iCloud
- La sincronización inicial puede tardar varios minutos dependiendo del tamaño del backup

📱 **Si cambias de dispositivo:**
1. Instala SkyRanch en el nuevo dispositivo
2. Inicia sesión con tu cuenta de usuario de SkyRanch
3. Inicia sesión con la misma cuenta de iCloud
4. Ve a Configuración > Backup y Restauración
5. Verás todos tus backups disponibles para restaurar

---

## Soporte Técnico

Si encuentras problemas con la sincronización de iCloud:

1. Verifica tu conexión WiFi
2. Verifica que iCloud Drive esté habilitado
3. Verifica que hay espacio disponible en iCloud
4. Cierra y vuelve a abrir la app
5. Si el problema persiste, contacta a soporte técnico

**Información útil para soporte:**
- Versión de iOS
- Versión de la app SkyRanch
- Mensaje de error específico (si lo hay)
- Espacio disponible en iCloud
