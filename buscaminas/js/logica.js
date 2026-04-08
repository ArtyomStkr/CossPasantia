let tablero = [];
let minas = [];
let filas = 0;
let columnas = 0;
let totalMinas = 0;
let celdasReveladas = 0;
let juegoActivo = false;
let timerInterval = null;
let segundos = 0;
let primerClick = true;
let modoBandera = false;

function iniciarJuego(config) {
    filas = config.filas;
    columnas = config.columnas;
    totalMinas = config.minas;
    celdasReveladas = 0;
    primerClick = true;
    segundos = 0;
    juegoActivo = true;
    modoBandera = false;

    if (timerInterval) clearInterval(timerInterval);

    document.getElementById('menu-dificultad').classList.add('hidden');
    document.getElementById('juego-container').classList.remove('hidden');
    document.getElementById('modal-resultado').classList.add('hidden');
    document.getElementById('mines-count').textContent = `💣 ${totalMinas}`;
    document.getElementById('timer').textContent = `⏱️ 0`;
    document.getElementById('btn-reset').textContent = '😊';
    document.getElementById('btn-flag').classList.remove('active');

    crearTablero();
    timerInterval = setInterval(actualizarTimer, 1000);
}

function crearTablero() {
    tablero = [];
    minas = [];
    const tableroDiv = document.getElementById('tablero');
    tableroDiv.innerHTML = '';
    tableroDiv.style.gridTemplateColumns = `repeat(${columnas}, 1fr)`;
    
    const disponible = window.innerWidth - 40;
    const celdaSize = Math.floor(disponible / columnas);
    
    for (let i = 0; i < filas; i++) {
        tablero[i] = [];
        for (let j = 0; j < columnas; j++) {
            tablero[i][j] = {
                esMina: false,
                revelada: false,
                marcada: false,
                vecinoMinas: 0
            };

            const celda = document.createElement('button');
            celda.className = 'celda';
            celda.style.width = `${celdaSize}px`;
            celda.style.height = `${celdaSize}px`;
            celda.dataset.fila = i;
            celda.dataset.columna = j;
            celda.addEventListener('click', () => clickCelda(i, j));
            celda.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                marcarCelda(i, j);
            });
            celda.addEventListener('touchstart', (e) => {
                e.preventDefault();
                manejarTouch(i, j);
            });
            
            tableroDiv.appendChild(celda);
        }
    }
}

let touchTimeout = null;
function manejarTouch(fila, columna) {
    if (!juegoActivo) return;
    
    if (touchTimeout) {
        clearTimeout(touchTimeout);
        touchTimeout = null;
        marcarCelda(fila, columna);
    } else {
        touchTimeout = setTimeout(() => {
            touchTimeout = null;
            clickCelda(fila, columna);
        }, 300);
    }
}

function colocarMinas(filaExcluir, colExcluir) {
    minas = [];
    let minasColocadas = 0;
    
    while (minasColocadas < totalMinas) {
        const f = Math.floor(Math.random() * filas);
        const c = Math.floor(Math.random() * columnas);
        
        const cercaExcluida = Math.abs(f - filaExcluir) <= 1 && Math.abs(c - colExcluir) <= 1;
        
        if (!tablero[f][c].esMina && !cercaExcluida) {
            tablero[f][c].esMina = true;
            minas.push({ fila: f, columna: c });
            minasColocadas++;
        }
    }
    
    calcularVecinos();
}

function calcularVecinos() {
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            if (!tablero[i][j].esMina) {
                let count = 0;
                for (let di = -1; di <= 1; di++) {
                    for (let dj = -1; dj <= 1; dj++) {
                        const ni = i + di;
                        const nj = j + dj;
                        if (ni >= 0 && ni < filas && nj >= 0 && nj < columnas) {
                            if (tablero[ni][nj].esMina) count++;
                        }
                    }
                }
                tablero[i][j].vecinoMinas = count;
            }
        }
    }
}

function clickCelda(fila, columna) {
    if (!juegoActivo) return;
    
    const celda = tablero[fila][columna];
    if (celda.revelada) return;

    if (modoBandera) {
        marcarCelda(fila, columna);
        return;
    }
    
    if (celda.marcada) return;

    if (primerClick) {
        primerClick = false;
        colocarMinas(fila, columna);
    }

    if (celda.esMina) {
        gameOver(fila, columna);
    } else {
        revelarCelda(fila, columna);
        verificarVictoria();
    }
}

function revelarCelda(fila, columna) {
    const celda = tablero[fila][columna];
    if (celda.revelada || celda.marcada) return;

    celda.revelada = true;
    celdasReveladas++;

    const celdaDiv = document.querySelector(`[data-fila="${fila}"][data-columna="${columna}"]`);
    celdaDiv.classList.add('revelada');

    if (celda.vecinoMinas > 0) {
        celdaDiv.textContent = celda.vecinoMinas;
        celdaDiv.classList.add(`num-${celda.vecinoMinas}`);
    } else {
        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                const ni = fila + di;
                const nj = columna + dj;
                if (ni >= 0 && ni < filas && nj >= 0 && nj < columnas) {
                    if (!tablero[ni][nj].revelada) {
                        setTimeout(() => revelarCelda(ni, nj), 10);
                    }
                }
            }
        }
    }
}

function marcarCelda(fila, columna) {
    if (!juegoActivo) return;
    
    const celda = tablero[fila][columna];
    if (celda.revelada) return;

    celda.marcada = !celda.marcada;
    
    const celdaDiv = document.querySelector(`[data-fila="${fila}"][data-columna="${columna}"]`);
    celdaDiv.classList.toggle('marcada');

    let marcadas = 0;
    for (let i = 0; i < filas; i++) {
        for (let j = 0; j < columnas; j++) {
            if (tablero[i][j].marcada) marcadas++;
        }
    }
    document.getElementById('mines-count').textContent = `💣 ${totalMinas - marcadas}`;
}

function gameOver(filaMina, colMina) {
    juegoActivo = false;
    clearInterval(timerInterval);

    for (const mina of minas) {
        const celdaDiv = document.querySelector(`[data-fila="${mina.fila}"][data-columna="${mina.columna}"]`);
        celdaDiv.classList.add('revelada', 'celda-mina');
    }

    const celdaExplotada = document.querySelector(`[data-fila="${filaMina}"][data-columna="${colMina}"]`);
    celdaExplotada.classList.add('explotada');

    document.getElementById('btn-reset').textContent = '😵';

    setTimeout(() => {
        mostrarResultado(false);
    }, 500);
}

function verificarVictoria() {
    const totalCeldas = filas * columnas;
    const celdasSeguras = totalCeldas - totalMinas;
    
    if (celdasReveladas >= celdasSeguras) {
        juegoActivo = false;
        clearInterval(timerInterval);
        document.getElementById('btn-reset').textContent = '😎';
        
        for (const mina of minas) {
            const celdaDiv = document.querySelector(`[data-fila="${mina.fila}"][data-columna="${mina.columna}"]`);
            celdaDiv.classList.add('marcada');
        }
        
        setTimeout(() => {
            mostrarResultado(true);
        }, 300);
    }
}

function mostrarResultado(victoria) {
    const modal = document.getElementById('modal-resultado');
    const titulo = document.getElementById('resultado-titulo');
    const texto = document.getElementById('resultado-texto');
    const tiempo = document.getElementById('resultado-tiempo');

    if (victoria) {
        titulo.textContent = '🎉 ¡VICTORIA!';
        titulo.style.color = '#4ade80';
        texto.textContent = 'Has revelado todas las celdas seguras';
    } else {
        titulo.textContent = '💥 ¡BOOM!';
        titulo.style.color = '#ef4444';
        texto.textContent = 'Has pisado una mina';
    }

    tiempo.textContent = `Tiempo: ${segundos} segundos`;
    modal.classList.remove('hidden');

    guardarPuntaje(victoria, segundos);
}

function guardarPuntaje(victoria, tiempo) {
    const dificultad = localStorage.getItem('buscaminasDificultad') || 'facil';
    const clavePuntajes = `buscaminasPuntajes_${dificultad}`;
    
    let puntajes = JSON.parse(localStorage.getItem(clavePuntajes) || '[]');
    
    if (victoria) {
        puntajes.push({
            tiempo: tiempo,
            fecha: new Date().toLocaleDateString()
        });
        puntajes.sort((a, b) => a.tiempo - b.tiempo);
        puntajes = puntajes.slice(0, 5);
        localStorage.setItem(clavePuntajes, JSON.stringify(puntajes));
    }
}

function actualizarTimer() {
    segundos++;
    document.getElementById('timer').textContent = `⏱️ ${segundos}`;
}

window.addEventListener('resize', () => {
    if (juegoActivo || celdasReveladas > 0) {
        const disponible = window.innerWidth - 40;
        const celdaSize = Math.floor(disponible / columnas);
        
        document.querySelectorAll('.celda').forEach(celda => {
            celda.style.width = `${celdaSize}px`;
            celda.style.height = `${celdaSize}px`;
        });
    }
});
