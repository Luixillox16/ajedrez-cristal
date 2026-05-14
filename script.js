// ============ VARIABLES GLOBALES ============
let game = new Chess();
let gameOver = false;
let selectedSquare = null;
let currentOrientation = 'w';
let moveAnalysis = [];
let currentDifficulty = 3;
let isAIGame = true;
let isFriendGame = false;
let selectedFriend = null;

// Datos del jugador
let playerData = {
    name: "Invitado",
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    friends: [],
    achievements: {
        'primer_mate': false,
        'primer_win': false,
        '10_partidas': false,
        'leccion_peon': false,
        'leccion_torre': false,
        'leccion_caballo': false,
        'leccion_alfil': false,
        'leccion_reina': false,
        'leccion_rey': false,
        'leccion_enroque': false,
        'leccion_paso': false,
        'leccion_promocion': false,
        'leccion_mate': false,
        'leccion_apertura': false
    }
};
let friendCode = "";

// Valores de piezas
const pieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 100 };

// Lecciones con sus preguntas
const lessons = [
    { id: 'peon', name: 'Peón', icon: '♙', description: 'Movimiento básico del peón',
      quiz: { question: '¿Cuántas casillas puede avanzar el peón en su primer movimiento?', options: ['1', '2', '3', 'Hasta 4'], correct: 1 } },
    { id: 'torre', name: 'Torre', icon: '♖', description: 'Movimiento de la torre',
      quiz: { question: '¿En qué direcciones se mueve la torre?', options: ['Diagonal', 'Horizontal y vertical', 'En L', 'Todas las direcciones'], correct: 1 } },
    { id: 'caballo', name: 'Caballo', icon: '♘', description: 'Movimiento del caballo',
      quiz: { question: '¿Qué forma tiene el movimiento del caballo?', options: ['Diagonal', 'Recta', 'En L (2+1)', 'Círculo'], correct: 2 } },
    { id: 'alfil', name: 'Alfil', icon: '♗', description: 'Movimiento del alfil',
      quiz: { question: '¿El alfil se mueve en...?', options: ['Solo horizontal', 'Solo diagonal', 'En todas direcciones', 'En L'], correct: 1 } },
    { id: 'reina', name: 'Reina', icon: '♕', description: 'Movimiento de la reina',
      quiz: { question: '¿La reina combina el movimiento de qué piezas?', options: ['Torre y Alfil', 'Torre y Caballo', 'Alfil y Caballo', 'Solo Torre'], correct: 0 } },
    { id: 'rey', name: 'Rey', icon: '♔', description: 'Movimiento del rey y enroque',
      quiz: { question: '¿Cuántas casillas puede mover el rey normalmente?', options: ['1', '2', '3', 'Todas'], correct: 0 } },
    { id: 'enroque', name: 'Enroque', icon: '🏰', description: 'Regla del enroque',
      quiz: { question: '¿El rey se mueve cuántas casillas al enrocar?', options: ['1', '2', '3', '4'], correct: 1 } },
    { id: 'al_paso', name: 'Captura al Paso', icon: '⚡', description: 'Captura especial de peón',
      quiz: { question: '¿La captura al paso solo puede realizarse en el turno inmediato?', options: ['Sí', 'No', 'Solo después de 2 turnos', 'Nunca'], correct: 0 } },
    { id: 'promocion', name: 'Promoción', icon: '👑', description: 'Peón se convierte en otra pieza',
      quiz: { question: '¿A qué pieza NO se puede promover un peón?', options: ['Dama', 'Torre', 'Rey', 'Caballo'], correct: 2 } },
    { id: 'jaque_mate', name: 'Jaque Mate', icon: '⚔️', description: 'Concepto básico de mate',
      quiz: { question: '¿Qué significa jaque mate?', options: ['El rey está amenazado', 'El rey no puede moverse', 'El rey está amenazado y no puede evitarlo', 'El rey captura una pieza'], correct: 2 } },
    { id: 'apertura', name: 'Apertura Italiana', icon: '🎯', description: 'Apertura básica',
      quiz: { question: '¿Cuál es el primer movimiento recomendado en la apertura italiana?', options: ['e4', 'd4', 'Cf3', 'c4'], correct: 0 } }
];

// ============ INICIALIZACIÓN ============
$(document).ready(() => {
    loadPlayerData();
    generateFriendCode();
    
    $('#mainMenu').addClass('active');
    $('#gameScreen').removeClass('active');
    
    // Eventos del menú
    $('#profileBtn, #activeProfileBtn').click(() => {
        updateProfileModal();
        $('#profileModal').css('display', 'flex');
    });
    
    $('#playVsAI').click(() => {
        isAIGame = true;
        isFriendGame = false;
        $('#difficultyModal').css('display', 'flex');
    });
    
    $('#playVsPlayer').click(() => {
        isAIGame = false;
        isFriendGame = false;
        startGame();
    });
    
    $('#playVsFriend').click(() => {
        if (playerData.friends.length === 0) {
            alert('Debes tener amigos agregados para jugar juntos');
            return;
        }
        renderFriendSelection();
        $('#friendSelectionModal').css('display', 'flex');
    });
    
    $('#lessonsBtn').click(() => {
        renderLessonsList();
        $('#lessonsModal').css('display', 'flex');
    });
    
    $('#rulesMenuBtn').click(() => $('#rulesModal').css('display', 'flex'));
    $('#backToMenuBtn').click(() => {
        $('#mainMenu').addClass('active');
        $('#gameScreen').removeClass('active');
    });
    
    $('#resignBtn').click(() => {
        if (!gameOver && !game.game_over()) {
            const winner = game.turn() === 'w' ? 'Negras' : 'Blancas';
            gameOver = true;
            $('#status').text(`¡${winner} ganan por rendición!`);
            updateStats(winner === 'Blancas' ? 'loss' : 'win');
            updateAnalysisPanel();
            showAnalysisOnMobile();
            alert(`Te has rendido. ¡Ganan ${winner}!`);
        }
    });
    
    $('#flipBoardBtn').click(flipBoard);
    $('#aiMoveBtn').click(forceAIMove);
    $('#exportAnalysisBtn').click(exportAnalysis);
    
    // Amigos
    $('#addFriendBtn').click(() => {
        const code = $('#friendCode').val().trim();
        if (code && code !== friendCode && !playerData.friends.includes(code)) {
            playerData.friends.push(code);
            savePlayerData();
            updateProfileModal();
            $('#friendCode').val('');
            alert('Amigo agregado!');
        } else if (code === friendCode) {
            alert('No puedes agregarte a ti mismo');
        } else {
            alert('Código inválido o ya agregado');
        }
    });
    
    $('#copyCodeBtn').click(() => {
        navigator.clipboard.writeText(friendCode);
        alert('Código copiado!');
    });
    
    // Dificultad
    $('.difficulty-btn').click(function() {
        $('.difficulty-btn').removeClass('active');
        $(this).addClass('active');
        currentDifficulty = parseInt($(this).data('diff'));
        startGame();
    });
    
    // Cerrar modales
    $('.close-profile, .close-lessons, .close-rules, .close-quiz, .close-friend-selection').click(function() {
        $(this).closest('.modal').hide();
    });
    
    $(window).click((e) => {
        if ($(e.target).hasClass('modal')) $(e.target).hide();
    });
    
    renderBoard();
});

// ============ RENDERIZADO DEL TABLERO ============
function renderBoard() {
    let html = '<table>';
    
    let rows = [0, 1, 2, 3, 4, 5, 6, 7];
    if (currentOrientation === 'b') rows = rows.reverse();
    
    for (let i of rows) {
        html += '<tr>';
        let cols = [0, 1, 2, 3, 4, 5, 6, 7];
        if (currentOrientation === 'b') cols = cols.reverse();
        
        for (let j of cols) {
            const piece = game.board()[i][j];
            const isLight = (i + j) % 2 === 0;
            const bgColor = isLight ? '#f5deb3' : '#5c3a21';
            const squareName = String.fromCharCode(97 + j) + (8 - i);
            
            let extraClass = '';
            if (selectedSquare === squareName) extraClass = 'selected';
            
            let isLegalMove = false;
            if (selectedSquare) {
                const moves = game.moves({ verbose: true });
                isLegalMove = moves.some(m => m.from === selectedSquare && m.to === squareName);
            }
            
            let pieceChar = '';
            if (piece) {
                if (piece.type === 'k') pieceChar = piece.color === 'w' ? '♔' : '♚';
                else if (piece.type === 'q') pieceChar = piece.color === 'w' ? '♕' : '♛';
                else if (piece.type === 'r') pieceChar = piece.color === 'w' ? '♖' : '♜';
                else if (piece.type === 'b') pieceChar = piece.color === 'w' ? '♗' : '♝';
                else if (piece.type === 'n') pieceChar = piece.color === 'w' ? '♘' : '♞';
                else if (piece.type === 'p') pieceChar = piece.color === 'w' ? '♙' : '♟';
            }
            
            const pieceColor = piece ? (piece.color === 'w' ? 'white' : 'black') : '';
            const legalDot = isLegalMove ? '<div class="legal-dot"></div>' : '';
            
            html += `<td class="${extraClass}" data-square="${squareName}" style="background-color:${bgColor}; position:relative; text-align:center; vertical-align:middle;">
                        ${legalDot}
                        <div class="piece ${pieceColor}" style="font-size:46px; display:flex; align-items:center; justify-content:center; width:100%; height:100%; text-shadow:2px 2px 4px rgba(0,0,0,0.3);">${pieceChar}</div>
                      </td>`;
        }
        html += '</tr>';
    }
    html += '</table>';
    
    $('#board').html(html);
    
    // Eventos click
    $('#board td').off('click').on('click', function() {
        const square = $(this).data('square');
        if (square) handleSquareClick(square);
    });
}

function handleSquareClick(square) {
    if (gameOver || game.game_over()) return;
    
    if (selectedSquare === null) {
        const piece = getPieceAt(square);
        if (piece && ((game.turn() === 'w' && piece.color === 'w') || (game.turn() === 'b' && piece.color === 'b'))) {
            selectedSquare = square;
            renderBoard();
        }
        return;
    }
    
    const move = { from: selectedSquare, to: square, promotion: 'q' };
    const result = game.move(move);
    selectedSquare = null;
    
    if (result) {
        analyzeAndSaveMove(result);
        renderBoard();
        updateUI();
        
        if (game.game_over()) {
            gameOver = true;
            let message = '';
            let resultType = '';
            if (game.in_checkmate()) {
                const winner = game.turn() === 'w' ? 'Negras' : 'Blancas';
                message = `¡${winner} ganan por Jaque Mate!`;
                resultType = winner === 'Blancas' ? 'win' : 'loss';
                if (resultType === 'win') checkAchievement('primer_mate');
            } else if (game.in_stalemate()) {
                message = '¡Ahogado! Tablas.';
                resultType = 'draw';
            }
            $('#status').text(message);
            if (resultType) updateStats(resultType);
            updateAnalysisPanel();
            showAnalysisOnMobile();
        } else if (isAIGame && game.turn() === 'b') {
            setTimeout(() => getAIMove(), 100);
        }
        updateAnalysisPanel();
    } else {
        renderBoard();
    }
}

function getPieceAt(square) {
    const board = game.board();
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square[1]);
    if (rank >= 0 && rank < 8 && file >= 0 && file < 8) {
        const piece = board[rank][file];
        if (piece) return { type: piece.type, color: piece.color };
    }
    return null;
}

// ============ FUNCIONES DEL JUGADOR ============
function generateFriendCode() {
    friendCode = 'CHESS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    $('#myFriendCode').text(friendCode);
}

function loadPlayerData() {
    const saved = localStorage.getItem('chessCristalData');
    if (saved) {
        const data = JSON.parse(saved);
        playerData = { ...playerData, ...data };
    }
    updateProfileDisplay();
}

function savePlayerData() {
    localStorage.setItem('chessCristalData', JSON.stringify(playerData));
}

function updateProfileDisplay() {
    $('#profileName, #profileModalName, #activeProfileName').text(playerData.name);
}

function updateProfileModal() {
    $('#gamesPlayed').text(playerData.gamesPlayed);
    $('#wins').text(playerData.wins);
    $('#losses').text(playerData.losses);
    $('#draws').text(playerData.draws);
    
    const achievementsList = $('#achievementsList');
    achievementsList.empty();
    const achievements = [
        { id: 'primer_win', name: 'Primera Victoria', desc: 'Gana tu primera partida', icon: '🏆' },
        { id: 'primer_mate', name: 'Jaque Mate', desc: 'Da tu primer jaque mate', icon: '⚔️' },
        { id: '10_partidas', name: 'Jugador Activo', desc: 'Completa 10 partidas', icon: '🎯' }
    ];
    achievements.forEach(ach => {
        const completed = playerData.achievements[ach.id] || false;
        achievementsList.append(`
            <div class="achievement ${completed ? '' : 'locked'}">
                <div class="achievement-icon">${ach.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${ach.name}</div>
                    <div class="achievement-desc">${ach.desc}</div>
                </div>
                <div>${completed ? '✓' : '🔒'}</div>
            </div>
        `);
    });
    
    const friendsList = $('#friendsList');
    friendsList.empty();
    if (playerData.friends.length === 0) {
        friendsList.html('<p style="text-align:center; color:rgba(255,255,255,0.5);">No hay amigos</p>');
    } else {
        playerData.friends.forEach(friend => {
            friendsList.append(`
                <div class="friend-item">
                    <span>${friend}</span>
                    <button class="remove-friend" data-code="${friend}">✖</button>
                </div>
            `);
        });
        $('.remove-friend').click(function() {
            const code = $(this).data('code');
            playerData.friends = playerData.friends.filter(f => f !== code);
            savePlayerData();
            updateProfileModal();
        });
    }
}

function renderFriendSelection() {
    const container = $('#friendsList2');
    container.empty();
    
    if (playerData.friends.length === 0) {
        $('#noFriendsMsg').show();
        return;
    }
    
    $('#noFriendsMsg').hide();
    playerData.friends.forEach(friend => {
        container.append(`
            <div class="friend-selection-item" data-friend="${friend}">
                <div class="friend-selection-icon">👫</div>
                <div class="friend-selection-info">
                    <strong>${friend}</strong>
                    <p>Juega una partida con este amigo</p>
                </div>
                <div class="friend-selection-arrow">→</div>
            </div>
        `);
    });
    
    $('.friend-selection-item').click(function() {
        selectedFriend = $(this).data('friend');
        $('#friendSelectionModal').hide();
        isAIGame = false;
        isFriendGame = true;
        startGame();
    });
}

function updateStats(result) {
    playerData.gamesPlayed++;
    if (result === 'win') playerData.wins++;
    else if (result === 'loss') playerData.losses++;
    else if (result === 'draw') playerData.draws++;
    
    if (playerData.gamesPlayed >= 10) playerData.achievements['10_partidas'] = true;
    if (result === 'win') playerData.achievements['primer_win'] = true;
    
    savePlayerData();
}

function checkAchievement(achievementId) {
    if (!playerData.achievements[achievementId]) {
        playerData.achievements[achievementId] = true;
        savePlayerData();
        return true;
    }
    return false;
}

// ============ LECCIONES ============
function renderLessonsList() {
    const container = $('#lessonsList');
    container.empty();
    
    lessons.forEach(lesson => {
        const completed = playerData.achievements[`leccion_${lesson.id}`] || false;
        container.append(`
            <div class="lesson-item ${completed ? 'completed' : ''}" data-lesson="${lesson.id}">
                <div class="lesson-icon">${lesson.icon}</div>
                <div class="lesson-info">
                    <strong>${lesson.name}</strong>
                    <p>${lesson.description}</p>
                </div>
                <div class="lesson-badge">
                    ${completed ? '<span class="lesson-complete">✓✓</span>' : '📖'}
                </div>
            </div>
        `);
    });
    
    $('.lesson-item').click(function() {
        const lessonId = $(this).data('lesson');
        const lesson = lessons.find(l => l.id === lessonId);
        if (lesson) showQuiz(lesson);
    });
}

function showQuiz(lesson) {
    const completed = playerData.achievements[`leccion_${lesson.id}`];
    if (completed) {
        alert(`✨ ¡Ya completaste la lección de ${lesson.name}! ✨`);
        return;
    }
    
    $('#quizTitle').text(`📚 Prueba: ${lesson.name}`);
    const quizContent = $(`
        <div class="lesson-quiz">
            <div class="quiz-question">${lesson.quiz.question}</div>
            <div id="quizOptions"></div>
            <div id="quizFeedback" class="quiz-feedback"></div>
        </div>
    `);
    
    const optionsDiv = quizContent.find('#quizOptions');
    lesson.quiz.options.forEach((opt, idx) => {
        optionsDiv.append(`<div class="quiz-option" data-opt="${idx}">${opt}</div>`);
    });
    
    $('#quizContent').html(quizContent);
    $('#quizModal').css('display', 'flex');
    
    $('.quiz-option').click(function() {
        const selected = parseInt($(this).data('opt'));
        const isCorrect = (selected === lesson.quiz.correct);
        
        $('.quiz-option').removeClass('correct incorrect');
        if (isCorrect) {
            $(this).addClass('correct');
            $('#quizFeedback').html('<div style="background:#00b894; padding:10px; border-radius:10px;">✅ ¡Correcto! Has completado la lección.</div>');
            playerData.achievements[`leccion_${lesson.id}`] = true;
            savePlayerData();
            renderLessonsList();
            setTimeout(() => $('#quizModal').hide(), 1500);
        } else {
            $(this).addClass('incorrect');
            $('#quizFeedback').html('<div style="background:#ff4757; padding:10px; border-radius:10px;">❌ Incorrecto. La respuesta correcta era: ' + lesson.quiz.options[lesson.quiz.correct] + '</div>');
        }
    });
}

// ============ ANÁLISIS DE MOVIMIENTOS ============
function analyzeAndSaveMove(move) {
    let quality = evaluateMoveQuality(move);
    moveAnalysis.push({
        move: move.san,
        color: move.color,
        quality: quality
    });
}

function evaluateMoveQuality(move) {
    let score = 0;
    const tempGame = new Chess(game.fen());
    
    if (tempGame.in_checkmate()) return 'master';
    if (tempGame.in_check()) score += 2;
    
    if (move.flags && move.flags.includes('c')) {
        const capturedValue = pieceValues[move.captured] || 0;
        score += capturedValue;
    }
    
    if (move.flags && move.flags.includes('p')) score += 8;
    
    const centerFiles = ['d', 'e'];
    if (centerFiles.includes(move.to[0])) score += 1;
    
    if (score >= 6) return 'master';
    if (score >= 3) return 'good';
    return 'normal';
}

function updateAnalysisPanel() {
    let master = 0, good = 0, normal = 0;
    
    moveAnalysis.forEach(a => {
        if (a.quality === 'master') master++;
        else if (a.quality === 'good') good++;
        else normal++;
    });
    
    $('#masterMoves').text(master);
    $('#goodMoves').text(good);
    $('#normalMoves').text(normal);
    
    const historyHtml = [];
    moveAnalysis.forEach((a, idx) => {
        let className = '', symbol = '';
        if (a.quality === 'master') { className = 'move-master'; symbol = ' !!'; }
        else if (a.quality === 'good') { className = 'move-good'; symbol = ' !'; }
        else { className = 'move-normal'; }
        
        const num = Math.floor(idx / 2) + 1;
        const prefix = a.color === 'w' ? `${num}. ` : '';
        historyHtml.push(`<span class="move-item ${className}">${prefix}${a.move}${symbol}</span>`);
    });
    $('#moveHistoryList').html(historyHtml.join(''));
}

// ============ MOSTRAR ANÁLISIS EN MÓVIL ============
function showAnalysisOnMobile() {
    // Solo en pantallas móviles (768px o menos)
    if (window.innerWidth <= 768) {
        $('.analysis-panel').addClass('show-on-mobile');
    }
}

function hideAnalysisOnMobile() {
    // Ocultar el análisis al iniciar una nueva partida
    if (window.innerWidth <= 768) {
        $('.analysis-panel').removeClass('show-on-mobile');
    }
}

// ============ IA ============
async function getAIMove() {
    if (!isAIGame) return;
    if (game.game_over() || gameOver || game.turn() !== 'b') return;
    
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return;
    
    let selectedMove;
    
    if (currentDifficulty === 1) {
        selectedMove = moves[Math.floor(Math.random() * moves.length)];
    } else if (currentDifficulty === 2) {
        if (Math.random() < 0.3) selectedMove = getBestCaptureMove(moves);
        else selectedMove = moves[Math.floor(Math.random() * moves.length)];
    } else if (currentDifficulty === 3) {
        selectedMove = getGoodMove(moves);
    } else if (currentDifficulty === 4) {
        selectedMove = getAdvancedMove(moves);
    } else {
        selectedMove = getBestMove(moves);
    }
    
    if (selectedMove) makeAIMove(selectedMove);
}

function getBestCaptureMove(moves) {
    const captureMoves = moves.filter(m => m.flags && m.flags.includes('c'));
    if (captureMoves.length > 0) {
        captureMoves.sort((a, b) => (pieceValues[b.captured] || 0) - (pieceValues[a.captured] || 0));
        return captureMoves[0];
    }
    return moves[Math.floor(Math.random() * moves.length)];
}

function getGoodMove(moves) {
    const captureMoves = moves.filter(m => m.flags && m.flags.includes('c'));
    if (captureMoves.length > 0) return captureMoves[0];
    
    const centerMoves = moves.filter(m => {
        const file = m.to.charCodeAt(0) - 96;
        const rank = parseInt(m.to[1]);
        return (file >= 3 && file <= 6 && rank >= 3 && rank <= 6);
    });
    
    if (centerMoves.length > 0 && Math.random() > 0.5) return centerMoves[0];
    return moves[Math.floor(Math.random() * moves.length)];
}

function getAdvancedMove(moves) {
    const captureMoves = moves.filter(m => m.flags && m.flags.includes('c'));
    if (captureMoves.length > 0) return captureMoves[0];
    
    for (const move of moves) {
        const tempGame = new Chess(game.fen());
        tempGame.move(move);
        if (tempGame.in_check()) return move;
    }
    return getGoodMove(moves);
}

function getBestMove(moves) {
    const captureMoves = moves.filter(m => m.flags && m.flags.includes('c'));
    if (captureMoves.length > 0) {
        captureMoves.sort((a, b) => (pieceValues[b.captured] || 0) - (pieceValues[a.captured] || 0));
        return captureMoves[0];
    }
    
    for (const move of moves) {
        const tempGame = new Chess(game.fen());
        tempGame.move(move);
        if (tempGame.in_check()) return move;
    }
    return getGoodMove(moves);
}

function makeAIMove(move) {
    const result = game.move(move);
    if (result) {
        analyzeAndSaveMove(result);
        renderBoard();
        updateUI();
        updateAnalysisPanel();
        
        if (game.game_over()) {
            gameOver = true;
            let message = '';
            let resultType = '';
            if (game.in_checkmate()) {
                const winner = game.turn() === 'w' ? 'Negras' : 'Blancas';
                message = `¡${winner} ganan!`;
                resultType = winner === 'Blancas' ? 'loss' : 'win';
            } else if (game.in_stalemate()) {
                message = '¡Ahogado! Tablas.';
                resultType = 'draw';
            }
            $('#status').text(message);
            if (resultType) updateStats(resultType);
            showAnalysisOnMobile();
        }
    }
}

// ============ ACTUALIZACIÓN DE UI ============
function updateUI() {
    let turnText = game.turn() === 'w' ? 'Blancas' : 'Negras';
    
    if (isFriendGame) {
        turnText = game.turn() === 'w' ? '👤 Tu Turno' : `👫 ${selectedFriend}`;
    }
    
    $('#turn').text(turnText);
    const history = game.history();
    $('#moveCount').text(history.length);
    if (history.length > 0) $('#lastMove').text(history[history.length - 1]);
    
    if (game.in_check() && !game.game_over()) $('#status').text('¡JAQUE!');
    else if (!game.game_over()) $('#status').text('Jugando');
}

function startGame() {
    $('#difficultyModal').hide();
    $('#mainMenu').removeClass('active');
    $('#gameScreen').addClass('active');
    
    if (isAIGame) $('#aiControls').show();
    else $('#aiControls').hide();
    
    resetGame();
}

function resetGame() {
    game = new Chess();
    gameOver = false;
    selectedSquare = null;
    moveAnalysis = [];
    renderBoard();
    updateUI();
    updateAnalysisPanel();
    hideAnalysisOnMobile();
    $('#status').text('Jugando');
}

function forceAIMove() {
    if (!isAIGame) {
        alert('Modo 1vs1: No hay IA para forzar');
        return;
    }
    if (!game.game_over() && !gameOver && game.turn() === 'b') getAIMove();
    else if (!game.game_over() && game.turn() === 'w') alert('Es turno de las blancas');
    else alert('La partida terminó');
}

function flipBoard() {
    currentOrientation = currentOrientation === 'w' ? 'b' : 'w';
    selectedSquare = null;
    renderBoard();
}

function exportAnalysis() {
    let pgn = `[Event "Partida Analizada"]\n[Date "${new Date().toLocaleDateString()}"]\n[White "Jugador"]\n[Black "${isAIGame ? 'IA' : (isFriendGame ? selectedFriend : 'Jugador 2')}"]\n\n`;
    
    let moves = [];
    moveAnalysis.forEach((a, idx) => {
        if (a.color === 'w') {
            let text = `${Math.floor(idx / 2) + 1}. ${a.move}`;
            if (a.quality === 'master') text += ' !!';
            else if (a.quality === 'good') text += ' !';
            moves.push(text);
        } else {
            let last = moves[moves.length - 1];
            moves[moves.length - 1] = `${last} ${a.move}`;
            if (a.quality === 'master') moves[moves.length - 1] += ' !!';
            else if (a.quality === 'good') moves[moves.length - 1] += ' !';
        }
    });
    
    pgn += moves.join(' ') + ' *';
    
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ajedrez_${Date.now()}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
    alert('Análisis exportado a PGN');
}
