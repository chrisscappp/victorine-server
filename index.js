const port = 1111
const io = require("socket.io")(port, {
	cors: {
		origin: "*"
	}
})

let players = []
let statsPlayersAfterGame = []

io.on('connection', (socket) => {
	console.log('The new user has joined from socket_id: ' + socket.id)
	socket.on('join_to_game', (data) => {
		const findedPlayer = players.find(player => player.name === data.name)
		if (!findedPlayer) {
			players.push(data)
			socket.broadcast.emit("receive_join_to_game", players)
			socket.broadcast.emit("cant_join_to_game", { message: "" })
		}
		socket.broadcast.emit("cant_join_to_game", { message: "Имя уже занято" })
	})
	socket.on('disconnect_on_game', (data) => {
		const filteredPlayers = players.filter(player => player.name !== data.name)
		players = filteredPlayers
		socket.broadcast.emit("receive_disconnect_on_game", filteredPlayers)
	})
	socket.on('update_player_game_status', (data) => {
		const findedPlayer = players.find(player => player.name === data.name)
		if (findedPlayer) {
			const playerIndex = players.indexOf(findedPlayer)
			if (playerIndex !== -1) {
				players[playerIndex] = data
				socket.broadcast.emit("receive_update_player_game_status", players)
			}
		}
	})
	socket.on('start_game', (data) => {
		const playersWithoutLeader = data.filter(user => user.role !== "leader")
		statsPlayersAfterGame = playersWithoutLeader
		socket.broadcast.emit('recieve_start_game', data)
	})
	socket.on('player_answer_the_question', (data) => {
		socket.broadcast.emit('receive_player_answer_the_question', data)
	})
	socket.on('right_answer', (data) => {
		const { player, scores } = data
		const findedPlayerIndex = statsPlayersAfterGame.findIndex(p => p.name === player.name)
		if (findedPlayerIndex !== -1) {
			statsPlayersAfterGame[findedPlayerIndex].scores += scores
			socket.broadcast.emit('receive_right_answer', statsPlayersAfterGame[findedPlayerIndex])
		}
	})
	socket.on('unright_answer', (data) => {
		socket.broadcast.emit('receive_unright_answer', data)
	})
	socket.on('game_over', () => {
		players = []
		socket.broadcast.emit("receive_game_over", statsPlayersAfterGame)
		statsPlayersAfterGame = []
	})
})