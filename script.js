document.addEventListener('DOMContentLoaded', () => {
    let board = null;
    const game = new Chess();
    const moveHistory = document.getElementById('move-history');
    let moveCount = 1;
    let boardFlipped = false;

    // Record and display a move in the move history
    const recordMove = (move, count) => {
        const formattedMove = count % 2 === 1 ? `${Math.ceil(count / 2)}. ${move}` : `${move} - `;
        moveHistory.textContent += formattedMove + ' ';
        moveHistory.scrollTop = moveHistory.scrollHeight;
    };

    // Optimized evaluation function for material and center control
    const evaluateBoard = (game) => {
        const fen = game.fen();
        const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 1000 }; // King has very high value
        let score = 0;

        // Calculate material balance
        for (const char of fen.split(' ')[0]) {
            if (/[pnbrqkPNBRQK]/.test(char)) {
                const value = pieceValues[char.toLowerCase()] || 0;
                score += char === char.toUpperCase() ? value : -value;
            }
        }

        // Add positional evaluation (center control, piece activity)
        score += evaluatePositionalFactors(game);

        return score;
    };

    // Positional evaluation for center control
    const evaluatePositionalFactors = (game) => {
        let score = 0;

        // Evaluate central control (center squares are valuable)
        const centerSquares = ['d4', 'd5', 'e4', 'e5'];
        centerSquares.forEach(square => {
            if (game.get(square)) {
                score += game.get(square).color === 'w' ? 0.5 : -0.5;
            }
        });

        return score;
    };

    // Minimax algorithm with alpha-beta pruning for fast AI
    const minimax = (depth, isMaximizing, alpha, beta) => {
        if (depth === 0 || game.game_over()) {
            return evaluateBoard(game);
        }

        const moves = game.moves();
        let bestValue = isMaximizing ? -Infinity : Infinity;

        for (const move of moves) {
            game.move(move);
            const value = minimax(depth - 1, !isMaximizing, alpha, beta);
            game.undo();

            if (isMaximizing) {
                bestValue = Math.max(bestValue, value);
                alpha = Math.max(alpha, bestValue);
            } else {
                bestValue = Math.min(bestValue, value);
                beta = Math.min(beta, bestValue);
            }

            if (alpha >= beta) break; // Alpha-beta pruning
        }
        return bestValue;
    };

    // Find the best move using the minimax algorithm based on the current difficulty (fixed depth 3)
    const findBestMove = () => {
        const moves = game.moves();
        let bestMove = null;
        let bestValue = -Infinity;

        for (const move of moves) {
            game.move(move);
            const boardValue = minimax(2, false, -Infinity, Infinity); // Depth 2
            game.undo();

            if (boardValue > bestValue) {
                bestValue = boardValue;
                bestMove = move;
            }
        }

        return bestMove;
    };

    // Make the computer's move
    const makeBestMove = () => {
        if (game.game_over()) {
            alert("Game over!");
            return;
        }

        const bestMove = findBestMove();
        game.move(bestMove);
        board.position(game.fen());
        recordMove(bestMove, moveCount++);
    };

    // Drag-and-drop handlers
    const onDragStart = (source, piece) => {
        if (game.game_over() || piece.search(/^b/) !== -1) return false;
    };

    const onDrop = (source, target) => {
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q',
        });

        if (move === null) return 'snapback';

        recordMove(move.san, moveCount++);
        makeBestMove();  // Immediate AI move after the player
    };

    const onSnapEnd = () => {
        board.position(game.fen());
    };

    // Reset the game
    window.resetGame = () => {
        game.reset();
        board.start();
        moveHistory.textContent = '';
        moveCount = 1;
    };

    // Set a custom position on the board
    window.setPosition = () => {
        const position = prompt("Enter FEN (Forsyth–Edwards Notation):", game.fen());
        if (position) {
            try {
                game.load(position);
                board.position(game.fen());
                moveHistory.textContent = '';
                moveCount = 1;
            } catch (e) {
                alert("Invalid FEN position.");
            }
        }
    };

    // Flip the board orientation
    window.flipBoard = () => {
        boardFlipped = !boardFlipped;
        board.flip();
    };

    // Chessboard configuration
    const config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
    };

    board = Chessboard('board', config);
});
