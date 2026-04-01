let config = {
    fecha_inicio: "17/03/2026",
    horas_totales: 340,
    horas_por_dia: 8,
    dias_descartados: []
};

function cargarConfig() {
    fetch('js/config.json')
        .then(r => r.json())
        .then(data => {
            config = data;
            if (!config.dias_descartados) config.dias_descartados = [];
            if (!config.horas_por_dia) config.horas_por_dia = 8;
            inicializarApp();
        })
        .catch(() => inicializarApp());
}

function parsearFecha(f) {
    const [d, m, a] = f.split('/').map(Number);
    return new Date(a, m - 1, d);
}

function formatearFecha(f) {
    return `${String(f.getDate()).padStart(2,'0')}/${String(f.getMonth()+1).padStart(2,'0')}/${f.getFullYear()}`;
}

function getDiasLaborablesTotales() {
    return Math.ceil(config.horas_totales / config.horas_por_dia);
}

function esDiaLaborable(f) {
    if (f.getDay() === 0 || f.getDay() === 6) return false;
    return !config.dias_descartados.includes(formatearFecha(f));
}

function obtenerDiasLaborables() {
    const dias = [], ini = new Date(parsearFecha(config.fecha_inicio));
    const diasTotales = getDiasLaborablesTotales();
    let c = 0;
    while (c < diasTotales) {
        if (esDiaLaborable(ini)) dias.push({ fecha: new Date(ini), num: c + 1 }), c++;
        ini.setDate(ini.getDate() + 1);
    }
    return dias;
}

function calcularFechaFinReal() {
    const diasLaborables = obtenerDiasLaborables();
    let fin = new Date(parsearFecha(config.fecha_inicio));
    diasLaborables.forEach(d => fin = d.fecha);
    let descartadosDespues = new Date(fin);
    config.dias_descartados.forEach(dStr => {
        const d = parsearFecha(dStr);
        if (d > fin) {
            let tmp = new Date(fin);
            while (tmp < d) tmp.setDate(tmp.getDate() + 1);
            while (!esDiaLaborable(tmp) && tmp <= d) tmp.setDate(tmp.getDate() + 1);
            if (tmp > descartadosDespues) descartadosDespues = tmp;
        }
    });
    return descartadosDespues > fin ? descartadosDespues : fin;
}

function calcularProgreso() {
    const ini = parsearFecha(config.fecha_inicio), hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    let c = 0, act = new Date(ini);
    while (act < hoy) { if (esDiaLaborable(act)) c++; act.setDate(act.getDate() + 1); }
    const diasTotales = getDiasLaborablesTotales();
    return { dias: c, pct: Math.min((c / diasTotales) * 100, 100) };
}

function getColorBarra(pct) {
    if (pct >= 70) return 'from-green-600 via-green-500 to-green-400';
    if (pct >= 40) return 'from-yellow-500 via-yellow-400 to-yellow-300';
    return 'from-red-600 via-red-500 to-red-400';
}

function dibujarCalendario() {
    const canvas = document.getElementById('calendario-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d'), dias = obtenerDiasLaborables();
    const { dias: completados } = calcularProgreso();
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    
    const cols = 9, tam = 44, pad = 4, filas = Math.ceil(dias.length / cols);
    canvas.width = cols * tam + pad * 2;
    canvas.height = filas * (tam + 6) + pad * 2 + 20;
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    dias.forEach((d, i) => {
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

function guardarConfig() {
    try {
        const nueva = JSON.parse(document.getElementById('json-config').value);
        if (nueva.fecha_inicio && nueva.horas_totales) {
            config = nueva;
            if (!config.dias_descartados) config.dias_descartados = [];
            if (!config.horas_por_dia) config.horas_por_dia = 8;
            localStorage.setItem('pasantiaConfig', JSON.stringify(config));
            actualizarInterfaz();
        }
    } catch { alert('JSON invalido'); }
}

function resetearConfig() {
    config = { fecha_inicio: "17/03/2026", horas_totales: 340, horas_por_dia: 8, dias_descartados: [] };
    localStorage.removeItem('pasantiaConfig');
    document.getElementById('json-config').value = JSON.stringify(config, null, 2);
    actualizarInterfaz();
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
    const txt = document.getElementById('json-config');
    if (txt) txt.value = JSON.stringify(config, null, 2);
    dibujarCalendario();
    actualizarInterfaz();
    iniciarLoader();
}

document.addEventListener('DOMContentLoaded', () => {
    const guardada = localStorage.getItem('pasantiaConfig');
    if (guardada) {
        const g = JSON.parse(guardada);
        config = g;
        if (!config.dias_descartados) config.dias_descartados = [];
        if (!config.horas_por_dia) config.horas_por_dia = 8;
    }
    cargarConfig();
});