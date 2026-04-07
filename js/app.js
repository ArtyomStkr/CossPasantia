function getColorBarra(pct) {
    if (pct >= 70) return 'from-green-600 via-green-500 to-green-400';
    if (pct >= 40) return 'from-yellow-500 via-yellow-400 to-yellow-300';
    return 'from-red-600 via-red-500 to-red-400';
}

let diasCalendario = [];
const cols = 9, tam = 44, pad = 4;

function dibujarCalendario() {
    const canvas = document.getElementById('calendario-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    diasCalendario = obtenerDiasLaborables();
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    
    const filas = Math.ceil(diasCalendario.length / cols);
    canvas.width = cols * tam + pad * 2;
    canvas.height = filas * (tam + 6) + pad * 2 + 20;
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    diasCalendario.forEach((d, i) => {
        const f = Math.floor(i / cols), c = i % cols;
        const x = pad + c * tam + tam / 2, y = pad + 20 + f * (tam + 6) + tam / 2;
        const esPasado = d.fecha < hoy, esHoy = d.fecha.getTime() === hoy.getTime();
        
        ctx.beginPath();
        ctx.roundRect(x - 18, y - 18, 36, 36, 6);
        ctx.fillStyle = esHoy ? '#fbbf24' : esPasado ? '#22c55e' : '#374151';
        ctx.fill();
        if (esHoy) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
        
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('D' + d.num, x, y + 4);
    });
}

function getDiaEnPosicion(x, y) {
    const col = Math.floor((x - pad) / tam);
    const fila = Math.floor((y - pad - 20) / (tam + 6));
    const indice = fila * cols + col;
    return diasCalendario[indice] || null;
}

function mostrarTooltip(e) {
    const canvas = document.getElementById('calendario-canvas');
    const tooltip = document.getElementById('tooltip');
    if (!canvas || !tooltip) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const dia = getDiaEnPosicion(x, y);
    if (dia) {
        tooltip.textContent = `Dia ${dia.num}: ${formatearFecha(dia.fecha)}`;
        tooltip.classList.add('visible');
    } else {
        tooltip.classList.remove('visible');
    }
}

function ocultarTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) tooltip.classList.remove('visible');
}

function inicializarTooltips() {
    const canvas = document.getElementById('calendario-canvas');
    if (!canvas) return;
    
    canvas.addEventListener('mousemove', mostrarTooltip);
    canvas.addEventListener('mouseleave', ocultarTooltip);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        mostrarTooltip({ clientX: touch.clientX, clientY: touch.clientY });
    });
    canvas.addEventListener('touchend', ocultarTooltip);
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        mostrarTooltip({ clientX: touch.clientX, clientY: touch.clientY });
    });
}

function actualizarInterfaz() {
    const { dias, pct } = calcularProgreso();
    const fin = calcularFechaFinReal();
    const diasTotales = getDiasLaborablesTotales();
    const color = getColorBarra(pct);
    
    const barra = document.getElementById('barra-progreso');
    if (barra) {
        barra.className = `h-full rounded-md transition-all duration-700 relative overflow-hidden bg-gradient-to-r ${color}`;
        barra.style.width = `${pct}%`;
    }
    
    document.getElementById('dias-transcurridos').textContent = `${dias}/${diasTotales}`;
    document.getElementById('porcentaje').textContent = `${pct.toFixed(1)}%`;
    document.getElementById('fecha-inicio').textContent = config.fecha_inicio;
    document.getElementById('fecha-final').textContent = formatearFecha(fin);
    dibujarCalendario();
}

function iniciarLoader() {
    const { dias, pct } = calcularProgreso();
    const barra = document.getElementById('loader-bar');
    const pctTxt = document.getElementById('loader-percent');
    
    if (barra) {
        barra.className = `h-full rounded-md bg-gradient-to-r ${getColorBarra(pct)}`;
        barra.style.width = `${pct}%`;
    }
    if (pctTxt) pctTxt.textContent = `${pct.toFixed(1)}%`;
    
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
    }, 800);
}

function inicializarApp() {
    dibujarCalendario();
    actualizarInterfaz();
    iniciarLoader();
    inicializarTooltips();
}

document.addEventListener('DOMContentLoaded', () => {
    cargarConfig(inicializarApp);
});
