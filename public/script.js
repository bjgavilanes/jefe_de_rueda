// URL del archivo Excel
const excelUrl = 'https://cdn.glitch.global/8dc8186d-a60b-4436-a7f7-a512e95a52f5/TITULOS_VALORES_MONOPOLIO.xlsx?v=1736704420028';

// Variables globales
let jugadores = [];
let movimientos = [];
let mercadoDatos = [];
let mercadoDatosOriginal = [];

// Referencias a elementos del DOM
const jugadorInput = document.getElementById('jugador-input');
const addJugadorBtn = document.getElementById('add-jugador-btn');
const jugadoresList = document.getElementById('jugadores-list');
const iniciarPartidaBtn = document.getElementById('iniciar-partida-btn');

const movimientosSection = document.getElementById('movimientos-section');
const tipoMovimientoSelect = document.getElementById('tipo-movimiento');
const tipoRentaSelect = document.getElementById('tipo-renta'); // Tipo de Renta
const empresaSelect = document.getElementById('empresa');
const jugadorSelect = document.getElementById('jugador'); // Selección de Jugador
const jugadorReceptorSelect = document.getElementById('jugador-receptor'); // Selección de Jugador Receptor
const jugadorCompradorSelect = document.getElementById('jugador-comprador'); // Selección de Jugador Comprador
const precioInput = document.getElementById('precio');
const registrarMovimientoBtn = document.getElementById('registrar-movimiento-btn');

const mercadoSection = document.getElementById('mercado-section');
const mercadoTableBody = document.querySelector('#mercado-table tbody');

const portafolioSection = document.getElementById('portafolio-section');
const portafolioTableBody = document.querySelector('#portafolio-table tbody');

const movimientosRegistradosSection = document.getElementById('movimientos-registrados-section');
const movimientosTableBody = document.querySelector('#movimientos-table tbody');
const exportarBtn = document.getElementById('exportar-btn');

// Función para cargar y parsear el archivo Excel
async function cargarExcel() {
    try {
        const response = await fetch(excelUrl);
        if (!response.ok) {
            throw new Error(`Error al descargar el archivo Excel: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        console.log("Datos brutos del Excel:", jsonData); // Registro de los datos brutos

        mercadoDatosOriginal = jsonData.map((row, index) => {
            // Registro de las claves de cada fila para depuración
            console.log(`Fila ${index + 1} claves:`, Object.keys(row));

            // Verificar que todas las columnas necesarias existan
            const requiredColumns = ['EMPRESA', 'TIPO DE RENTA', 'MERCADO PRIMARIO', 'MERCADO SECUNDARIO', 'RENDIMIENTO'];
            for (const col of requiredColumns) {
                if (!(col in row)) {
                    console.error(`Falta la columna '${col}' en la fila ${index + 1}.`);
                    throw new Error(`Falta la columna '${col}' en la fila ${index + 1}.`);
                }
            }

            // Verificar que las columnas no estén vacías
            for (const col of requiredColumns) {
                if (row[col] === "" || row[col] === null) {
                    console.error(`La columna '${col}' está vacía en la fila ${index + 1}.`);
                    throw new Error(`La columna '${col}' está vacía en la fila ${index + 1}.`);
                }
            }

            return {
                EMPRESA: row['EMPRESA'].toString().trim(),
                TIPO_DE_RENTA: row['TIPO DE RENTA'].toString().trim(),
                MERCADO_PRIMARIO: parseFloat(row['MERCADO PRIMARIO']),
                MERCADO_SECUNDARIO: parseFloat(row['MERCADO SECUNDARIO']),
                RENDIMIENTO: parseFloat(row['RENDIMIENTO'])
            };
        });

        console.log("Datos del mercado procesados:", mercadoDatosOriginal);
        mercadoDatos = [...mercadoDatosOriginal]; // Inicializar mercadoDatos con todos los datos
        actualizarEmpresas();
        actualizarMercado();
    } catch (error) {
        console.error("Error al cargar el archivo Excel:", error);
        alert(`No se pudo cargar el archivo de empresas.\n${error.message}`);
    }
}

// Función para agregar un jugador
function agregarJugador() {
    const nombre = jugadorInput.value.trim();
    if (nombre && !jugadores.find(j => j.nombre === nombre)) {
        const nuevoJugador = {
            nombre: nombre,
            liquidez: 50, // Inicio de Juego: 50M
            inversiones: []
        };
        jugadores.push(nuevoJugador);
        const li = document.createElement('li');
        li.textContent = nombre;
        jugadoresList.appendChild(li);
        jugadorInput.value = '';
        actualizarJugadorSelect();
    } else {
        alert("Por favor ingrese un nombre válido y único para el jugador.");
    }
}

// Función para actualizar el select de jugadores en movimientos
function actualizarJugadorSelect() {
    jugadorSelect.innerHTML = '<option value="">Seleccione Jugador</option>';
    jugadorReceptorSelect.innerHTML = '<option value="">Seleccione Jugador Receptor</option>';
    jugadorCompradorSelect.innerHTML = '<option value="">Seleccione Jugador Comprador</option>'; // Nuevo

    jugadores.forEach(jugador => {
        const option = document.createElement('option');
        option.value = jugador.nombre;
        option.textContent = jugador.nombre;
        jugadorSelect.appendChild(option);

        const optionReceptor = document.createElement('option');
        optionReceptor.value = jugador.nombre;
        optionReceptor.textContent = jugador.nombre;
        jugadorReceptorSelect.appendChild(optionReceptor);

        const optionComprador = document.createElement('option');
        optionComprador.value = jugador.nombre;
        optionComprador.textContent = jugador.nombre;
        jugadorCompradorSelect.appendChild(optionComprador);
    });

    // "Decevale" solo en Comprador para Venta
    // Se añadirá dinámicamente en actualizarEmpresasSegunMovimiento
}

// Función para iniciar la partida
function iniciarPartida() {
    if (jugadores.length === 0) {
        alert("Debe agregar al menos un jugador.");
        return;
    }
    movimientosSection.style.display = 'block';
    mercadoSection.style.display = 'block';
    portafolioSection.style.display = 'block';
    actualizarMercado();
    actualizarPortafolio();
    iniciarPartidaBtn.disabled = true; // Evitar reiniciar partida
    addJugadorBtn.disabled = true; // Evitar agregar más jugadores
    document.getElementById('añadir-jugadores').style.display = 'none';

}

// Función para actualizar el select de empresas según el tipo de movimiento
function actualizarEmpresasSegunMovimiento() {
    const tipo = tipoMovimientoSelect.value;
    const tipoRenta = tipoRentaSelect.value;
    const jugadorSeleccionado = jugadorSelect.value;
    const jugadorReceptorSeleccionado = jugadorReceptorSelect.value;
    const empresaContainer = document.getElementById('empresa-container');
    empresaContainer.style.display = 'block'; // Mostrar siempre el contenedor de Empresa para los casos que lo requieran

    // Reiniciar el select de empresas
    empresaSelect.innerHTML = '<option value="">Seleccione Empresa</option>';

    if (tipo === "Compra") {
        // Filtrar empresas según Tipo de Renta seleccionado
        if (tipoRenta === "") {
            return; // Esperar a que se seleccione Tipo de Renta
        }
        const filtroNormalizado = tipoRenta.toUpperCase().trim();
        mercadoDatos.forEach(empresa => {
            const tipoRentaEmpresa = empresa.TIPO_DE_RENTA.toUpperCase().trim();
            if (tipoRentaEmpresa === filtroNormalizado) {
                const option = document.createElement('option');
                option.value = empresa.EMPRESA;
                option.textContent = empresa.EMPRESA;
                empresaSelect.appendChild(option);
            }
        });
    } else if (tipo === "Venta") {
        // Filtrar empresas que pertenecen al jugador seleccionado
		document.getElementById('jugador').addEventListener('change', function() {
	    empresaSelect.innerHTML = '<option value="">Seleccione Empresa</option>';
		const jugadorSeleccionado = document.getElementById('jugador').value
		const index = jugadores.findIndex((jugadores) => jugadores.nombre === jugadorSeleccionado)
        jugadores[index].inversiones.map(empresa => {
            const option = document.createElement('option');
            option.value = ""
            option.textContent = empresa
            empresaSelect.appendChild(option);
        });
});

        // Mostrar el selector de Comprador
        document.getElementById('jugador-comprador-container').style.display = 'block';
    } else if (tipo === "Cobro de Rendimiento") {
        // Filtrar empresas que pertenecen al jugador receptor
        const jugadorReceptor = jugadores.find(j => j.nombre === jugadorReceptorSeleccionado);
        if (!jugadorReceptor) return;

        jugadorReceptor.inversiones.forEach(empresaNombre => {
            const option = document.createElement('option');
            option.value = empresa.EMPRESA;
            option.textContent = empresa.EMPRESA;
            empresaSelect.appendChild(option);
        });
    } else if (tipo === "Pago de Impuestos") {
        // Mostrar solo dos opciones específicas
        const opciones = [
            { nombre: "CUOTA MANTENIMIENTO BVG", precio: 5 },
            { nombre: "RENOVACIÓN CALIFICACIÓN DE RIESGO", precio: 4 }
        ];
        opciones.forEach(opcion => {
            const option = document.createElement('option');
            option.value = opcion.nombre;
            option.textContent = opcion.nombre;
            empresaSelect.appendChild(option);
        });
    } else {
        // Otros pagos u otros tipos de movimientos
        // Manejar según sea necesario
    }
}

// Función para actualizar el select de empresas general (usada al cargar Excel)
function actualizarEmpresas(filtroTipoRenta = "") {
    console.log(`Filtrando empresas por Tipo de Renta: "${filtroTipoRenta}"`); // Depuración

    empresaSelect.innerHTML = '<option value="">Seleccione Empresa</option>';
    let contador = 0; // Contador para verificar cuántas empresas coinciden

    // Convertir filtro a mayúsculas y sin espacios para coincidir con el Excel
    const filtroNormalizado = filtroTipoRenta.toUpperCase().trim();

    mercadoDatos.forEach(empresa => {
        // Normalizar tipo de renta de la empresa
        const tipoRentaEmpresa = empresa.TIPO_DE_RENTA.toUpperCase().trim();

        console.log(`Evaluando empresa: "${empresa.EMPRESA}" con Tipo de Renta: "${empresa.TIPO_DE_RENTA}"`); // Depuración

        if (filtroNormalizado === "" || tipoRentaEmpresa === filtroNormalizado) {
            const option = document.createElement('option');
            option.value = empresa.EMPRESA;
            option.textContent = empresa.EMPRESA;
            empresaSelect.appendChild(option);
            contador++;
        }
    });

    console.log(`Total de empresas mostradas: ${contador}`); // Depuración

    if (contador === 0 && filtroTipoRenta !== "") {
        alert(`No se encontraron empresas para el Tipo de Renta: "${filtroTipoRenta}".`);
    }
}

// Función para actualizar el precio basado en tipo de movimiento y empresa
function actualizarPrecio() {
    const tipo = tipoMovimientoSelect.value;
    const empresaNombre = empresaSelect.value;
    const jugadorCompradorNombre = jugadorCompradorSelect.value; // Para Venta
    const tipoRenta = tipoRentaSelect.value;
    const jugadorReceptorNombre = jugadorReceptorSelect.value;

    if (tipo && empresaNombre) {
        if (tipo === "Compra") {
            // Auto completar con MERCADO_PRIMARIO
            const empresa = mercadoDatos.find(e => e.EMPRESA === empresaNombre);
            if (empresa) {
                precioInput.value = empresa.MERCADO_PRIMARIO.toFixed(2);
                precioInput.readOnly = true;
            }
        } else if (tipo === "Venta") {
            if (jugadorCompradorNombre === "Decevale") {
                // Auto completar con MERCADO_SECUNDARIO
                const empresa = mercadoDatosOriginal.find(e => e.EMPRESA === empresaNombre);
                if (empresa) {
                    precioInput.value = empresa.MERCADO_SECUNDARIO.toFixed(2);
                    precioInput.readOnly = true;
                }
            } else {
                // Permitir edición manual
                precioInput.value = '';
                precioInput.readOnly = false;
            }
        } else if (tipo === "Cobro de Rendimiento") {
            // Auto completar con RENDIMIENTO
            const empresa = mercadoDatosOriginal.find(e => e.EMPRESA === empresaNombre);
            if (empresa) {
                precioInput.value = empresa.RENDIMIENTO.toFixed(2);
                precioInput.readOnly = true;
            }
        } else if (tipo === "Pago de Impuestos") {
            // Auto completar con valores fijos
            if (empresaNombre === "CUOTA MANTENIMIENTO BVG") {
                precioInput.value = '5';
            } else if (empresaNombre === "RENOVACIÓN CALIFICACIÓN DE RIESGO") {
                precioInput.value = '4';
            }
            precioInput.readOnly = true;
        } else if (tipo === "Otro Pagos") {
            // Permitir edición manual
            precioInput.value = '';
            precioInput.readOnly = false;
        } else {
            precioInput.value = '';
            precioInput.readOnly = true;
        }
    } else {
        precioInput.value = '';
        precioInput.readOnly = true;
    }

    // Mostrar u ocultar contenedores según el tipo de movimiento
    if (["Compra"].includes(tipo)) {
        document.getElementById('tipo-renta-container').style.display = 'block';
    } else {
        document.getElementById('tipo-renta-container').style.display = 'none';
    }

    if (tipo === "Cobro de Rendimiento") {
        document.getElementById('jugador-receptor-container').style.display = 'block';
    } else {
        document.getElementById('jugador-receptor-container').style.display = 'none';
    }

    if (tipo === "Venta") {
        document.getElementById('jugador-comprador-container').style.display = 'block';
    } else {
        document.getElementById('jugador-comprador-container').style.display = 'none';
    }
}

// Función para registrar un movimiento
function registrarMovimiento() {
    const tipo = tipoMovimientoSelect.value;
    const tipoRenta = tipoRentaSelect.value;
    const empresaNombre = empresaSelect.value;
    const jugadorNombre = jugadorSelect.value;
    const jugadorReceptorNombre = jugadorReceptorSelect.value; // Nuevo
    const jugadorCompradorNombre = jugadorCompradorSelect.value; // Nuevo
    let precio = parseFloat(precioInput.value);

    if (!tipo) {
        alert("Por favor seleccione el tipo de movimiento.");
        return;
    }

    // Validaciones específicas según el tipo de movimiento
    if (tipo === "Compra") {
        if (!jugadorNombre || !tipoRenta || !empresaNombre) {
            alert("Por favor complete todos los campos requeridos para la compra.");
            return;
        }
    } else if (tipo === "Venta") {
        if (!jugadorNombre || !empresaNombre || !jugadorCompradorNombre) {
            alert("Por favor complete todos los campos requeridos para la venta.");
            return;
        }
    } else if (tipo === "Cobro de Rendimiento") {
        if (!jugadorNombre || !jugadorReceptorNombre || !empresaNombre) {
            alert("Por favor complete todos los campos requeridos para el cobro de rendimiento.");
            return;
        }
    } else if (tipo === "Pago de Impuestos") {
        if (!jugadorNombre || !empresaNombre) {
            alert("Por favor complete todos los campos requeridos para el pago de impuestos.");
            return;
        }
    } else if (tipo === "Otro Pagos") {
        // No se requieren todos los campos
        if (!jugadorNombre) {
            alert("Por favor seleccione un jugador.");
            return;
        }
        if (isNaN(precio) || precio <= 0) {
            alert("Por favor ingrese un precio válido.");
            return;
        }
    } else {
        alert("Tipo de movimiento no reconocido.");
        return;
    }

    // Procesar el movimiento según el tipo
    switch(tipo) {
        case "Compra":
            manejarCompra(jugadorNombre, empresaNombre, precio);
            break;

        case "Venta":
            manejarVenta(jugadorNombre, jugadorCompradorNombre, empresaNombre, precio);
            break;

        case "Cobro de Rendimiento":
            manejarCobroRendimiento(jugadorNombre, jugadorReceptorNombre, empresaNombre);
            break;

        case "Pago de Impuestos":
            manejarPagoImpuestos(jugadorNombre, empresaNombre, precio);
            break;

        case "Otro Pagos":
            manejarOtroPago(jugadorNombre, precio);
            break;

        default:
            alert("Tipo de movimiento no reconocido.");
            return;
    }

    actualizarMercado();
    actualizarPortafolio();
    actualizarMovimientosTabla();
    alert("Movimiento registrado exitosamente.");
}

// Función para manejar compras
function manejarCompra(jugadorNombre, empresaNombre, precio) {
    const jugador = jugadores.find(j => j.nombre === jugadorNombre);
    const empresa = mercadoDatos.find(e => e.EMPRESA === empresaNombre);
    if (!jugador || !empresa) {
        alert("Jugador o empresa no encontrada.");
        return;
    }

    if (jugador.liquidez < precio) {
        alert("El jugador no tiene suficiente liquidez para realizar la compra.");
        return;
    }

    // Restar liquidez al jugador
    jugador.liquidez -= precio;

    // Añadir la inversión
    jugador.inversiones.push(empresaNombre)

    // Registrar el movimiento
    const movimiento = {
        "Jugador": jugadorNombre,
        "Tipo de Movimiento": "Compra",
        "Empresa": empresaNombre,
        "Precio": precio,
        "rendimiento": empresa.RENDIMIENTO,
        "Detalle": `Compra de ${empresaNombre} a ${precio}M`
    };
    movimientos.push(movimiento);

    // Eliminar la empresa del mercado
    mercadoDatos = mercadoDatos.filter(e => e.EMPRESA !== empresaNombre);
}

// Función para manejar ventas
function manejarVenta(vendedorNombre, compradorNombre, empresaNombre, precio) {
    const vendedor = jugadores.find(j => j.nombre === vendedorNombre);
    const comprador = (compradorNombre === "Decevale") ? { nombre: "Decevale", liquidez: Infinity, inversiones: {} } : jugadores.find(j => j.nombre === compradorNombre);
    const empresa = mercadoDatosOriginal.find(e => e.EMPRESA === empresaNombre);

    if (!vendedor) {
        alert("Vendedor no encontrado.");
        return;
    }

    if (!comprador && compradorNombre !== "Decevale") {
        alert("Comprador no encontrado.");
        return;
    }

    if (!vendedor.inversiones[empresaNombre] || vendedor.inversiones[empresaNombre] < 1) {
        alert("El vendedor no posee suficientes títulos de esta empresa.");
        return;
    }

    if (isNaN(precio) || precio <= 0) {
        alert("Por favor ingrese un precio válido.");
        return;
    }

    if (compradorNombre !== "Decevale" && comprador.liquidez < precio) {
        alert("El comprador no tiene suficiente liquidez para realizar la compra.");
        return;
    }

    // Transferir liquidez
    if (compradorNombre !== "Decevale") {
        comprador.liquidez -= precio;
    }
    vendedor.liquidez += precio;

    // Transferir la inversión
    vendedor.inversiones[empresaNombre] -= 1;
    if (compradorNombre !== "Decevale") {
        if (comprador.inversiones[empresaNombre]) {
            comprador.inversiones[empresaNombre] += 1;
        } else {
            comprador.inversiones[empresaNombre] = 1;
        }
    }

    // Registrar el movimiento
    const movimiento = {
        "Jugador": compradorNombre,
        "Tipo de Movimiento": "Venta",
        "Empresa": empresaNombre,
        "Precio": precio,
        "rendimiento": empresa.RENDIMIENTO,
        "Detalle": `${compradorNombre} compró ${empresaNombre} a ${vendedorNombre} por ${precio}M`
    };
    movimientos.push(movimiento);

    // Eliminar la empresa del mercado si ha sido comprada (excepto por Decevale)
    if (compradorNombre !== "Decevale") {
        mercadoDatos = mercadoDatos.filter(e => e.EMPRESA !== empresaNombre);
    }
}

// Función para manejar cobro de rendimiento (Un jugador paga y otro recibe)
function manejarCobroRendimiento(jugadorPagadorNombre, jugadorReceptorNombre, empresaNombre) {
    const jugadorPagador = jugadores.find(j => j.nombre === jugadorPagadorNombre);
    const jugadorReceptor = jugadores.find(j => j.nombre === jugadorReceptorNombre);
    const empresa = mercadoDatosOriginal.find(e => e.EMPRESA === empresaNombre);

    if (!jugadorPagador || !jugadorReceptor || !empresa) {
        alert("Jugador pagador, receptor o empresa no encontrada.");
        return;
    }

    // Verificar que el pagador posea la inversión en la empresa
    if (!jugadorPagador.inversiones[empresaNombre] || jugadorPagador.inversiones[empresaNombre] < 1) {
        alert("El jugador pagador no posee la inversión en esta empresa.");
        return;
    }

    const rendimiento = empresa.RENDIMIENTO; // Suponiendo que es un valor fijo

    if (jugadorPagador.liquidez < rendimiento) {
        alert("El jugador pagador no tiene suficiente liquidez para pagar el rendimiento.");
        return;
    }

    // Restar liquidez al pagador y sumar al receptor
    jugadorPagador.liquidez -= rendimiento;
    jugadorReceptor.liquidez += rendimiento;

    // Registrar el movimiento
    const movimiento = {
        "Jugador": jugadorReceptorNombre,
        "Tipo de Movimiento": "Cobro de Rendimiento",
        "Empresa": empresaNombre,
        "Precio": rendimiento,
        "rendimiento": empresa.RENDIMIENTO,
        "Detalle": `${jugadorReceptorNombre} cobró ${rendimiento}M de rendimiento de ${jugadorPagadorNombre} por ${empresaNombre}`
    };
    movimientos.push(movimiento);
}

// Función para manejar pago de impuestos
function manejarPagoImpuestos(jugadorNombre, empresaNombre, precio) {
    const jugador = jugadores.find(j => j.nombre === jugadorNombre);
    if (!jugador) {
        alert("Jugador no encontrado.");
        return;
    }

    if (jugador.liquidez < precio) {
        alert("El jugador no tiene suficiente liquidez para pagar impuestos.");
        return;
    }

    // Restar liquidez al jugador
    jugador.liquidez -= precio;

    // Registrar el movimiento
    const movimiento = {
        "Jugador": jugadorNombre,
        "Tipo de Movimiento": "Pago de Impuestos",
        "Empresa": empresaNombre,
        "Precio": precio,
        "rendimiento": "",
        "Detalle": `Pago de impuestos: ${empresaNombre} - ${precio}M`
    };
    movimientos.push(movimiento);
}

// Función para manejar otros pagos
function manejarOtroPago(jugadorNombre, precio) {
    const jugador = jugadores.find(j => j.nombre === jugadorNombre);
    if (!jugador) {
        alert("Jugador no encontrado.");
        return;
    }

    if (jugador.liquidez < precio) {
        alert("El jugador no tiene suficiente liquidez para realizar el pago.");
        return;
    }

    // Restar liquidez al jugador
    jugador.liquidez -= precio;

    // Registrar el movimiento
    const movimiento = {
        "Jugador": jugadorNombre,
        "Tipo de Movimiento": "Otro Pago",
        "Empresa": "",
        "Precio": precio,
        "rendimiento": "",
        "Detalle": `Otro pago de ${precio}M`
    };
    movimientos.push(movimiento);
}

// Función para actualizar la tabla del mercado
function actualizarMercado() {
    mercadoTableBody.innerHTML = '';
    mercadoDatos.forEach(empresa => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${empresa.EMPRESA}</td>
            <td>${empresa.MERCADO_PRIMARIO}</td>
            <td>${empresa.RENDIMIENTO}</td>
        `;
        mercadoTableBody.appendChild(tr);
    });
}

// Función para actualizar la tabla de portafolio
function actualizarPortafolio() {
    portafolioTableBody.innerHTML = '';
    jugadores.forEach(jugador => {
        const tr = document.createElement('tr');
        
        // Calcular total de rendimientos
        let totalRendimientos = 0;
        for (const [empresa, cantidad] of Object.entries(jugador.inversiones)) {
            const empresaData = mercadoDatosOriginal.find(e => e.EMPRESA === empresa);
            if (empresaData) {
                totalRendimientos += empresaData.RENDIMIENTO * cantidad;
            }
        }

        // Calcular total (Liquidez + Rendimientos)
        const total = jugador.liquidez + totalRendimientos;

        tr.innerHTML = `
            <td>${jugador.nombre}</td>
            <td>${jugador.liquidez.toFixed(2)} M</td>
            <td>${totalRendimientos.toFixed(2)} M</td>
            <td>${total.toFixed(2)} M</td>
        `;
        portafolioTableBody.appendChild(tr);
    });
}

// Función para actualizar la tabla de movimientos
function actualizarMovimientosTabla() {
    movimientosTableBody.innerHTML = '';
    movimientos.forEach(mov => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${mov.Jugador}</td>
            <td>${mov["Tipo de Movimiento"]}</td>
            <td>${mov.Empresa}</td>
            <td>${mov.Precio}</td>
            <td>${mov.rendimiento !== "" ? mov.rendimiento : 'N/A'}</td>
            <td>${mov.Detalle}</td>
        `;
        movimientosTableBody.appendChild(tr);
    });
}

// Función para exportar movimientos a Excel
function exportarMovimientos() {
    if (movimientos.length === 0) {
        alert("No hay movimientos para exportar.");
        return;
    }

    const wb = XLSX.utils.book_new();
    const ws_data = [
        ["Jugador", "Tipo de Movimiento", "Empresa", "Precio (M)", "Rendimiento", "Detalle"]
    ];
    movimientos.forEach(mov => {
        ws_data.push([
            mov.Jugador,
            mov["Tipo de Movimiento"],
            mov.Empresa,
            mov.Precio,
            mov.rendimiento !== "" ? mov.rendimiento : 'N/A',
            mov.Detalle
        ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
    XLSX.writeFile(wb, "Movimientos_Juego.xlsx");
}

// Event Listeners
addJugadorBtn.addEventListener('click', agregarJugador);
iniciarPartidaBtn.addEventListener('click', iniciarPartida);
tipoMovimientoSelect.addEventListener('change', function() {
    // Resetear campos relacionados
    tipoRentaSelect.value = '';
    jugadorSelect.value = '';
    jugadorReceptorSelect.value = '';
    jugadorCompradorSelect.value = '';
    empresaSelect.innerHTML = '<option value="">Seleccione Empresa</option>';
    precioInput.value = '';
    precioInput.readOnly = true;

    // Mostrar u ocultar contenedores según el tipo
    const tipo = tipoMovimientoSelect.value;
    if (["Compra", "Venta", "Cobro de Rendimiento", "Pago de Impuestos", "Otro Pagos"].includes(tipo)) {
        movimientosSection.style.display = 'block';
        actualizarEmpresasSegunMovimiento();
    } else {
        movimientosSection.style.display = 'none';
    }

    actualizarPrecio();
});
tipoRentaSelect.addEventListener('change', function() {
    actualizarEmpresasSegunMovimiento();
    actualizarPrecio();
});
empresaSelect.addEventListener('change', actualizarPrecio);
jugadorCompradorSelect.addEventListener('change', actualizarPrecio);
jugadorReceptorSelect.addEventListener('change', function() {
    actualizarEmpresasSegunMovimiento();
    actualizarPrecio();
});
registrarMovimientoBtn.addEventListener('click', registrarMovimiento);
exportarBtn.addEventListener('click', exportarMovimientos);

// Permitir agregar jugador con la tecla Enter
jugadorInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        agregarJugador();
    }
});

// Inicializar la carga del Excel cuando el documento esté listo
document.addEventListener('DOMContentLoaded', cargarExcel);
