# 📋 Registro de Trazabilidad y Cambios del Reto

## 📌 Contexto del Proyecto
* **Institución:** ESCUELA POLITÉCNICA NACIONAL - ESFOT
* **Asignatura:** Desarrollo de Aplicaciones Móviles
* **Proyecto:** Gestor de Gastos (Persistencia con React Native Expo y SQLite)
* **Entorno:** Expo SDK 57 con TypeScript y SQLite Relacional

---

## 🎯 Requerimientos del Reto Implementados

### Requerimiento A
1. **Campo Fecha Obligatorio:** Asociación de la fecha exacta al día en que se registra el gasto mediante un selector nativo de calendario.
2. **Campo Factura / Comprobante Opcional con Image Picker:** Posibilidad de adjuntar una foto de comprobante o factura, permitiendo al usuario:
   * 📷 Tomar foto directamente con la cámara del dispositivo móvil.
   * 🖼️ Seleccionar una imagen existente desde la galería de fotos.
   * 👁️ Previsualizar la foto y opción de removerla antes o después de guardar.

### Requerimiento B
1. **Editar Gasto:** Capacidad de modificar cualquier gasto registrado previamente (monto, categoría, fecha, descripción o comprobante) reflejando los cambios de inmediato en la base de datos y la interfaz.
2. **Eliminar Gasto:** Capacidad de borrar un gasto de la base de datos SQLite con cuadro de diálogo de confirmación previa para evitar pérdidas accidentales.
3. **Filtrado y Ordenamiento por Gastos Más Altos:** Barra de controles tipo chips para alternar instantáneamente entre la vista cronológica estándar (*"📅 Más recientes"*) y la vista ordenada por mayor valor (*"💰 Gastos más altos"*).

---

## 🛠️ Herramientas y Librerías Utilizadas

| Herramienta / Librería | Versión | Propósito Técnico |
| :--- | :--- | :--- |
| **`expo-sqlite`** | `~57.0.4` | Motor de base de datos relacional nativo en el dispositivo (`gastos.db`). Proporciona transacciones seguras, almacenamiento persistente y soporte para consultas SQL preparadas con el modo `WAL`. |
| **`expo-image-picker`** | `~57.0.20` | Acceso a las APIs nativas del hardware para captura con la cámara (`launchCameraAsync`) y exploración del almacenamiento multimedia (`launchImageLibraryAsync`), gestionando los permisos del sistema en tiempo de ejecución. |
| **`@react-native-community/datetimepicker`** | `9.1.0` | Selector de fecha nativo de Android/iOS. Garantiza que las fechas ingresadas sean válidas y cumplan el estándar de experiencia de usuario móvil. |
| **`expo-blur` & `expo-linear-gradient`** | SDK 57 | Elementos visuales del diseño Liquid Glass para tarjetas translúcidas, modales y fondos difuminados. |
| **`react-native-reanimated`** | `4.5.1` | Animaciones fluidas de entrada y salida para tarjetas de gastos y modales deslizantes. |

---

## 📂 Matriz de Trazabilidad de Archivos

A continuación se detalla cada archivo del proyecto modificado o creado, las secciones alteradas y la justificación técnica de cada cambio:

### 1. `package.json`
* **Cambio:** Se instalaron las dependencias compatibles con Expo SDK 57 mediante `npx expo install`.
* **Detalle:**
  * `@react-native-community/datetimepicker: "9.1.0"`
  * `expo-image-picker: "~57.0.20"`

---

### 2. `src/types/expense.ts`
* **Capa:** Tipos y Dominio.
* **Modificación:** Se extendió la interfaz `Expense` para dar soporte a comprobantes fotográficos:
  ```typescript
  export interface Expense {
    id: string;
    amount: number;
    category: Category;
    date: Date;
    description?: string;
    receiptUri?: string; // << NUEVO: Ruta local del comprobante/factura
  }
  ```
* **Justificación:** La interfaz modela los datos en memoria en TypeScript. Guardar `receiptUri` como `string` permite almacenar la ruta del archivo sin sobrecargar la memoria con datos binarios.

---

### 3. `src/database/database.ts`
* **Capa:** Configuración de Infraestructura de Base de Datos.
* **Modificación:**
  * Exportación de la constante `DATABASE_NAME = 'gastos.db'`.
  * Función `initDatabase(db: SQLiteDatabase)` conectada al `SQLiteProvider` en `_layout.tsx`.
  * Creación de la tabla `expenses` con soporte para `receiptUri TEXT`.
  * **Migración preventiva:** Se implementó una sentencia `ALTER TABLE expenses ADD COLUMN receiptUri TEXT;` encapsulada en `try/catch` para actualizar bases de datos creadas en fases previas sin borrar los registros existentes.

---

### 4. `src/database/expenseRepository.ts`
* **Capa:** Repositorio / Acceso a Datos (Data Access Object).
* **Modificación:**
  * `getAllExpenses(db)`: Lee las filas de SQLite incluyendo `receiptUri` y convierte el string ISO de fecha a objeto `new Date()`.
  * `insertExpense(db, expense)`: Inserta una nueva fila con parámetros vinculados (`?`) protegiendo contra inyección SQL.
  * `updateExpense(db, expense)`: **(NUEVO)** Actualiza los valores de un gasto existente según su `id`:
    ```sql
    UPDATE expenses
    SET amount = ?, category = ?, date = ?, description = ?, receiptUri = ?
    WHERE id = ?;
    ```
  * `deleteExpense(db, id)`: **(NUEVO)** Elimina físicamente el registro de la tabla mediante su identificador único:
    ```sql
    DELETE FROM expenses WHERE id = ?;
    ```

---

### 5. `src/context/ExpenseContext.tsx`
* **Capa:** Estado Global (Context API).
* **Modificación:**
  * Se agregaron `updateExpense(expense: Expense)` y `deleteExpense(id: string)` al contrato `ExpenseContextType`.
  * En `ExpenseProvider`, ambas funciones invocan las operaciones del repositorio sobre `db` (obtenido con `useSQLiteContext()`).
  * Actualización inmutable del estado local de React (`setExpenses`), sincronizando la pantalla inmediatamente tras la confirmación de la base de datos.

---

### 6. `src/components/AddExpenseModal.tsx`
* **Capa:** Componente de Presentación / Formulario.
* **Modificaciones principales:**
  1. **Selector de Fecha:** Botón que muestra la fecha seleccionada en formato legible e invoca el componente `DateTimePicker`.
  2. **Image Picker:** Botón para adjuntar factura que despliega un diálogo de selección:
     * *Tomar Foto:* Solicita permisos de cámara (`requestCameraPermissionsAsync`) y abre `launchCameraAsync`.
     * *Galería:* Solicita permisos multimedia (`requestMediaLibraryPermissionsAsync`) y abre `launchImageLibraryAsync`.
  3. **Previsualización de Comprobante:** Muestra la imagen cargada con botón para desvincularla si se desea.
  4. **Modo Edición vs Creación:** Acepta la prop `expenseToEdit?: Expense | null`. Si está presente:
     * Precarga automáticamente todos los campos del formulario.
     * Cambia los títulos a *"Editar Gasto"* y el botón a *"Actualizar"*.
     * Al guardar, invoca `updateExpense()` en lugar de `addExpense()`.

---

### 7. `src/components/ExpenseItem.tsx`
* **Capa:** Componente de Presentación / Tarjeta de Gasto.
* **Modificaciones:**
  * Se añadieron botones de acción:
    * ✏️ **Botón Editar:** Dispara el callback `onEdit(expense)` para abrir el modal en modo edición.
    * 🗑️ **Botón Eliminar:** Despliega una alerta nativa `Alert.alert` de confirmación; al confirmar, invoca `onDelete(expense.id)`.
  * **Insignia de Comprobante:** Si el gasto contiene una factura (`receiptUri`), se renderiza una miniatura con la etiqueta `🧾 Ver comprobante adjunto`, que permite ver el documento adjunto al hacer clic.

---

### 8. `src/app/index.tsx`
* **Capa:** Pantalla Principal (HomeScreen).
* **Modificaciones:**
  * **Barra de Chips de Ordenamiento:** Agregada bajo el encabezado mensual:
    * `[📅 Más recientes]`: Ordena cronológicamente (más nuevo arriba).
    * `[💰 Gastos más altos]`: Ordena numéricamente de forma descendente por `amount` (`b.amount - a.amount`).
  * **Orquestación de Edición:** Conecta el estado `editingExpense` con `ExpenseItem` y `AddExpenseModal`.
  * **Visor de Factura en Pantalla Completa:** Modal con fondo difuminado (`BlurView`) que permite inspeccionar la imagen del comprobante en tamaño completo al presionar sobre él en la lista.

---

## 💡 Conceptos Técnicos y Buenas Prácticas Aplicadas

1. **Persistencia Ligera de Imágenes (URIs vs Blobs):**
   * *Problema:* Guardar imágenes en Base64 o BLOB dentro de SQLite infla el tamaño del archivo `.db`, degrada el rendimiento de las consultas y satura la memoria RAM.
   * *Solución aplicada:* Se almacena únicamente la ruta local del archivo (`file:///...`) que entrega el sistema operativo.

2. **Parámetros Vinculados (Prepared Statements):**
   * Todas las sentencias SQL emplean marcadores `?` en lugar de concatenación de cadenas, garantizando seguridad frente a inyección SQL y formato consistente de valores nulos o flotantes.

3. **Arquitectura en Capas:**
   * Las vistas (`HomeScreen`, `ExpenseItem`, `AddExpenseModal`) no ejecutan SQL directamente; se comunican exclusivamente a través del Contexto (`useExpenses()`), que a su vez delega en el Repositorio (`expenseRepository.ts`).

4. **Tratamiento Bidireccional de Fechas:**
   * SQLite almacena fechas como texto en formato ISO 8601 (`toISOString()`). Al leerlas, el repositorio las reconvierte a objetos `Date` de JavaScript, permitiendo cálculos y filtrados precisos en los componentes.


---

## 🛡️ Reto 3: Controles y Validaciones en los Formularios (3 Puntos)

### 📌 Objetivos Implementados
1. **Control de Monto (Requerimiento 3.a):**
   * Solo acepta valores numéricos.
   * Restricción estricta a un máximo de dos decimales.
   * Campo estrictamente obligatorio (no permite guardar si está vacío, es 0 o no es un número).
2. **Control de Categoría Obligatoria (Requerimiento 3.b):**
   * Muestra un mensaje claro y explícito (mediante `Alert` nativo y texto de advertencia en pantalla) si el usuario intenta guardar sin seleccionar una categoría.
3. **Control de Descripción Alfanumérica (Requerimiento 3.c):**
   * Campo opcional.
   * No admite caracteres especiales: únicamente letras del alfabeto (incluyendo vocales con tildes, diéresis y la letra `ñ`), números del 0 al 9 y espacios en blanco.
   * Límite estricto de hasta 400 caracteres con visualización de contador en tiempo real.

---

### 🛠️ Herramientas y Técnicas Utilizadas en este Reto

| Herramienta / Técnica | ¿En dónde se utilizó? | ¿Por qué se utilizó? |
| :--- | :--- | :--- |
| **Expresiones Regulares (RegEx) para Monto**<br>`/^\d*\.?\d{0,2}$/` | En la función `handleAmountChange` en `AddExpenseModal.tsx`. | **Filtrado en caliente (en tiempo real):** Evita que el usuario pueda escribir más de un punto decimal, letras o más de 2 centavos. Además, normaliza automáticamente la coma `,` a punto `.` para teclados numéricos latinoamericanos. |
| **Expresiones Regulares (RegEx) para Descripción**<br>`/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]/g` | En la función `handleDescriptionChange` en `AddExpenseModal.tsx`. | **Sanitización automática:** Si el usuario intenta tipear o pegar símbolos especiales (`@`, `#`, `$`, `%`, `<`, `>`, etc.), estos se descartan de inmediato sin corromper la entrada. |
| **Propiedad nativa `maxLength={400}`** | Directamente sobre el `<TextInput>` de la descripción. | **Límite rígido a nivel de hardware/SO:** El motor del sistema operativo móvil impide que el texto exceda los 400 caracteres tanto por teclado como por pegado de portapapeles. |
| **Contador de caracteres dinámico** | En la cabecera del campo descripción (`{description.length}/400`). | **Retroalimentación visual (UX):** El usuario sabe exactamente cuántos caracteres ha consumido y cuánto espacio le queda disponible. |
| **Estados React de Error (`amountError`, `categoryError`)** | En `AddExpenseModal.tsx` vinculados al ciclo de vida del formulario. | **Feedback visual instantáneo:** Resalta los bordes en rojo y muestra mensajes claros al usuario cuando una validación falla. |
| **Alertas Nativas (`Alert.alert`)** | En la función `handleSubmit` antes de procesar el guardado. | **Interrupción amigable:** Si el usuario no elige categoría o deja el monto vacío, el sistema le notifica explícitamente el motivo por el cual no se puede proceder. |

---

### 🏛️ Decisiones Técnicas y de Diseño (Arquitectura de Formularios)

1. **Eliminación del botón "mudo" deshabilitado (`disabled`):**
   * *Problema de UX previo:* El botón *"Agregar"* tenía `disabled={!amount || !category}`. Cuando el usuario pulsaba el botón, este no reaccionaba y el usuario no sabía por qué la app no guardaba su gasto.
   * *Decisión técnica:* El botón ahora **siempre responde al toque**. Si falta la categoría o el monto es inválido, ejecuta las validaciones y lanza el mensaje explicativo correspondiente.

2. **Normalización de separadores decimales:**
   * Muchos teclados de dispositivos móviles en español muestran la coma `,` en su teclado numérico. Se implementó `text.replace(',', '.')` para evitar que usuarios en español vean rechazado su input por configuración regional.

3. **Inclusión de caracteres propios del idioma español:**
   * La regla de "solo números y letras del alfabeto" no excluye acentos (`á, é, í, ó, ú`), la letra `ñ/Ñ` o diéresis (`ü`), permitiendo una redacción natural en español de las descripciones (ej: *"Alimentación en la cafetería"*).

4. **Limpieza de errores en caliente:**
   * En cuanto el usuario empieza a corregir el monto o selecciona una categoría, los mensajes de error en rojo se limpian automáticamente, brindando una sensación ágil y fluida.


---

## 📅 Corrección y Mejora: Visualización Histórica de Gastos Multimes

### 📌 Diagnóstico del Problema
* **Síntoma:** Al registrar gastos con fechas de meses pasados (ej. Septiembre), los registros se guardaban en la base de datos SQLite pero **no se mostraban en la pantalla principal**.
* **Causa Raíz:** El archivo base `src/app/index.tsx` consumía exclusivamente la función `getCurrentMonthExpenses()`, la cual aplica un filtro estricto:
  `expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear`.
  Esto provocaba que cualquier gasto de un mes diferente al actual quedara oculto por la lógica de renderizado en memoria de React.

### 🛠️ Solución Implementada
1. En `src/app/index.tsx`, se conectó el estado global `expenses: allExpenses` junto con `getCurrentMonthExpenses()`.
2. Se introdujo el selector de alcance de visualización (`scope`):
   * **`🌐 Todos los gastos` (Por defecto):** Muestra el historial completo de gastos registrados en SQLite, permitiendo comprobar que los gastos de meses anteriores persisten y se visualizan correctamente.
   * **`📅 Solo este mes`:** Restringe la vista únicamente al mes en curso para análisis mensual enfocado.
3. Se integraron chips interactivos con diseño **Liquid Glass** para alternar fluidamente entre ambos modos sin recargar la pantalla.
