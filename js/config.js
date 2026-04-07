let config = {
    fecha_inicio: "17/03/2026",
    horas_totales: 340,
    horas_por_dia: 8,
    dias_descartados: []
};

const configJSON = {
    fecha_inicio: "17/03/2026",
    horas_totales: 360,
    horas_por_dia: 8,
    dias_descartados: ["03/04/2026"]
};

function cargarConfig(callback) {
    fetch('js/config.json')
        .then(r => r.json())
        .then(data => {
            aplicarConfig(data);
            if (callback) callback();
        })
        .catch(() => {
            aplicarConfig(configJSON);
            if (callback) callback();
        });
}

function aplicarConfig(data) {
    config = { ...data };
    const guardada = localStorage.getItem('pasantiaConfig');
    if (guardada) {
        const g = JSON.parse(guardada);
        if (g.fecha_inicio) config.fecha_inicio = g.fecha_inicio;
        if (g.horas_totales) config.horas_totales = g.horas_totales;
        if (g.horas_por_dia) config.horas_por_dia = g.horas_por_dia;
        if (g.dias_descartados && g.dias_descartados.length > 0) config.dias_descartados = g.dias_descartados;
    }
    if (!config.dias_descartados) config.dias_descartados = [];
    if (!config.horas_por_dia) config.horas_por_dia = 8;
    console.log('Config aplicado:', config);
}

function guardarConfig() {
    localStorage.setItem('pasantiaConfig', JSON.stringify(config));
}

function parsearFecha(f) {
    const [d, m, a] = f.split('/').map(Number);
    return new Date(a, m - 1, d);
}

function formatearFecha(f) {
    return `${String(f.getDate()).padStart(2,'0')}/${String(f.getMonth()+1).padStart(2,'0')}/${f.getFullYear()}`;
}

function getDiasLaborablesTotales() {
    const diasBase = Math.ceil(config.horas_totales / config.horas_por_dia);
    const ini = new Date(parsearFecha(config.fecha_inicio));
    let total = 0, c = 0, actual = new Date(ini);
    while (c < diasBase) {
        if (actual.getDay() !== 0 && actual.getDay() !== 6 && !config.dias_descartados.includes(formatearFecha(actual))) c++;
        total++;
        actual.setDate(actual.getDate() + 1);
    }
    return total;
}

function esDiaLaborable(f) {
    if (f.getDay() === 0 || f.getDay() === 6) return false;
    return !config.dias_descartados.includes(formatearFecha(f));
}

function obtenerDiasLaborables() {
    const dias = [], ini = new Date(parsearFecha(config.fecha_inicio));
    const diasBase = Math.ceil(config.horas_totales / config.horas_por_dia);
    let c = 0;
    while (c < diasBase) {
        if (esDiaLaborable(ini)) {
            dias.push({ fecha: new Date(ini), num: c + 1 });
            c++;
        }
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
